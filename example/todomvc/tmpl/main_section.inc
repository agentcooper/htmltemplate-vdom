<section class="main">
    <TMPL_IF [% $left_count == 0 %]>
        <input class="toggle-all" type="checkbox" checked>
    <TMPL_ELSE>
        <input class="toggle-all" type="checkbox">
    </TMPL_IF>
    <label for="toggle-all">Mark all as complete</label>
    <ul class="todo-list">
        <TMPL_FOR todo IN=todos>
            <TMPL_INLINE ./todo_item.inc
                BLOCK_NAME="TodoItem"
                BLOCK_KEY=[% $todo->{id} %]
                todo=[% $todo %]
                editing=[% $todo->{editing} %]>
        </TMPL_FOR>
    </ul>
</section>
