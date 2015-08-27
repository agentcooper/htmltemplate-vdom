<TMPL_VAR title>
<ul id="list">
    <TMPL_LOOP people>
        <li class="item <TMPL_IF active>item--active</TMPL_IF>">
            <TMPL_VAR name> <TMPL_VAR title>

            <ul>
                <TMPL_LOOP inner>
                    <li><TMPL_VAR title></li>
                </TMPL_LOOP>
            </ul>

            <TMPL_IF active>active<TMPL_ELSE>not active</TMPL_IF>
        </li>
    </TMPL_LOOP>
</ul>
