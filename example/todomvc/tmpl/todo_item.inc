## List items should get the class `editing` when editing and `completed`
## when marked as completed
<li
    class="
        <TMPL_IF todo.completed> completed</TMPL_IF>
        <TMPL_IF todo.editing> editing</TMPL_IF>
    ">
    <div class="view">
        <input class="toggle" type="checkbox" <TMPL_IF todo.completed>checked</TMPL_IF>>
        <label><TMPL_VAR todo.label></label>
        <button class="destroy"></button>
    </div>
    <input class="edit" value="<TMPL_VAR todo.label_draft>">
</li>
