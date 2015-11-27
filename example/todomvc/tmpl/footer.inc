<footer class="footer">
    <span class="todo-count">
        <TMPL_IF [% $left_count == 1 %]>
            <strong>1</strong> item left
        <TMPL_ELSE>
            <strong><TMPL_VAR left_count></strong> items left
        </TMPL_IF>
    </span>

    ## Remove this if you don't implement routing
    <TMPL_COMMENT>
        <ul class="filters">
            <li>
                <a class="selected" href="#/">All</a>
            </li>
            <li>
                <a href="#/active">Active</a>
            </li>
            <li>
                <a href="#/completed">Completed</a>
            </li>
        </ul>
    </TMPL_COMMENT>

    ## Hidden if no completed items are left ↓
    <TMPL_IF [% $completed_count > 0 %]>
        <button class="clear-completed">Clear completed</button>
    </TMPL_IF>
</footer>
