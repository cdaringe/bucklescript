let fprintf = Format.fprintf

let file_lines filePath =
  Ext_array.reverse_of_list
    (Ext_io.rev_lines_of_file filePath)

let setup_colors () =
  Misc.Color.setup !Clflags.color

let print_filename = Location.print_filename

let print_loc ~normalizedRange ppf (loc : Location.t) =
  setup_colors ();
  let dim_loc ppf = function
    | None -> ()
    | Some ((start_line, start_line_start_char), (end_line, end_line_end_char)) ->
      if start_line = end_line then
        if start_line_start_char = end_line_end_char then
          fprintf ppf ":@{<dim>%i:%i@}" start_line start_line_start_char
        else
          fprintf ppf ":@{<dim>%i:%i-%i@}" start_line start_line_start_char end_line_end_char
      else
        fprintf ppf ":@{<dim>%i:%i-%i:%i@}" start_line start_line_start_char end_line end_line_end_char
  in
  fprintf ppf "@{<filename>%a@}%a" print_filename loc.loc_start.pos_fname dim_loc normalizedRange
;;

let print ~message_kind intro ppf (loc : Location.t) =
    begin match message_kind with
    | `warning -> fprintf ppf "@[@{<info>%s@}@]@," intro
    | `warning_as_error -> fprintf ppf "@[@{<error>%s@} (configured as error) @]@," intro
    | `error -> fprintf ppf "@[@{<error>%s@}@]@," intro
    end;
    (* ocaml's reported line/col numbering is horrible and super error-prone
      when being handled programmatically (or humanly for that matter. If you're
      an ocaml contributor reading this: who the heck reads the character count
      starting from the first erroring character?) *)
    let (file, start_line, start_char) = Location.get_pos_info loc.loc_start in
    let (_, end_line, end_char) = Location.get_pos_info loc.loc_end in
    (* line is 1-indexed, column is 0-indexed. We convert all of them to 1-indexed to avoid confusion *)
    (* start_char is inclusive, end_char is exclusive *)
    let normalizedRange =
      if start_char == -1 || end_char == -1 then
        (* happens sometimes. Syntax error for example *)
        None
      else if start_line = end_line && start_char >= end_char then
        (* in some errors, starting char and ending char can be the same. But
           since ending char was supposed to be exclusive, here it might end up
           smaller than the starting char if we naively did start_char + 1 to
           just the starting char and forget ending char *)
        let same_char = start_char + 1 in
        Some ((start_line, same_char), (end_line, same_char))
      else
        (* again: end_char is exclusive, so +1-1=0 *)
        Some ((start_line, start_char + 1), (end_line, end_char))
    in
    fprintf ppf "@[%a@]@," (print_loc ~normalizedRange) loc;
    match normalizedRange with
    | None -> ()
    | Some range -> begin
      try
        let lines = file_lines file in
        (* we're putting the line break `@,` here rather than above, because this
           branch might not be reached (aka no inline file content display) so
           we don't wanna end up with two line breaks in the the consequent *)
        fprintf ppf "@,%a"
          (Super_misc.print_file ~is_warning:(message_kind=`warning) ~lines ~range)
          ()
      with
      (* this might happen if the file is e.g. "", "_none_" or any of the fake file name placeholders.
        we've already printed the location above, so nothing more to do here. *)
      | Sys_error _ -> ()
    end
;;

(* taken from https://github.com/rescript-lang/ocaml/blob/d4144647d1bf9bc7dc3aadc24c25a7efa3a67915/parsing/location.ml#L380 *)
(* This is the error report entry point. We'll replace the default reporter with this one. *)
let rec super_error_reporter self ppf ({main; sub} : Location.error) =
  setup_colors ();
  (* open a vertical box. Everything in our message is indented 2 spaces *)
  Format.fprintf ppf "@[<v 2>@,%a@,%t@,@]" (print ~message_kind:`error "We've found a bug for you!") main.loc main.txt ;
  List.iter (fun sub ->
    Format.fprintf ppf "@,@[%a@]" (super_error_reporter self) { main = sub; sub=[]; kind = Report_error }) sub
    (* no need to flush here; location's report_exception (which uses this ultimately) flushes *)

let super_error_reporter =
  { (Location.default_report_printer ())
    with pp = super_error_reporter
    }



(* extracted from https://github.com/rescript-lang/ocaml/blob/d4144647d1bf9bc7dc3aadc24c25a7efa3a67915/parsing/location.ml#L299 *)
(* This is the warning report entry point. We'll replace the default printer with this one *)
let super_warning_printer loc w =
  match Warnings.report w with
  | `Inactive -> None
  | `Active { Warnings.id; message; is_error; sub_locs } ->
      setup_colors ();
      let message_kind = if is_error then `warning_as_error else `warning in
      let msg_of_str str = fun ppf ->
        Format.fprintf ppf "@[<v 2>@,%a@,%s@,@]@."
          (print ~message_kind ("Warning number " ^ (Warnings.number w |> string_of_int)))
          loc
          str;
      in
      let kind =
       if is_error then Location.Report_warning_as_error id
       else Report_warning id
      in
      let main = { Location.loc; txt = msg_of_str message } in
      let sub = List.map (fun (loc, sub_message) ->
        { Location.loc; txt = msg_of_str sub_message }
      ) sub_locs in
      Some { Location.kind; main; sub }


    (* at this point, you can display sub_locs too, from e.g. https://github.com/ocaml/ocaml/commit/f6d53cc38f87c67fbf49109f5fb79a0334bab17a
      but we won't bother for now *)
;;

(* taken from https://github.com/rescript-lang/ocaml/blob/d4144647d1bf9bc7dc3aadc24c25a7efa3a67915/parsing/location.ml#L354 *)
let _print_phanton_error_prefix ppf =
  (* modified from the original. We use only 2 indentations for error report
    (see super_error_reporter above) *)
  Format.pp_print_as ppf 2 ""

(* let errorf ?(loc = none) ?(sub = []) = *)
  (* Format.kdprintf (mkerror loc sub) *)

let mkerror loc sub txt =
  { Location.kind = Report_error; main = { loc; txt }; sub }

let errorf ?(loc = Location.none) ?(sub = []) fmt =
  Format.kdprintf
    (mkerror loc sub)
    fmt

let error_of_printer loc print x =
  errorf ~loc "%a@?" print x

let error_of_printer_file print x =
  error_of_printer (Location.in_file !Location.input_name) print x

(* This will be called in super_main. This is how you override the default error and warning printers *)
let setup () =
  Location.report_printer := (fun () -> super_error_reporter);
  Location.warning_reporter := super_warning_printer;
