<TMPL_BLOCK person>
    <li class="item <TMPL_IF active>item--active</TMPL_IF>" onclick="itemClick(<TMPL_VAR id>)">
        <TMPL_VAR name> <a href="#/items/<TMPL_VAR id>">some link</a>

        <div class="input"><input type="text" placeholder="Type something here"/></div>

        <ul>
            <TMPL_LOOP inner>
                <li><TMPL_VAR title></li>
            </TMPL_LOOP>
        </ul>

        <div><TMPL_VAR city_copy><TMPL_VAR city></div>

        <TMPL_IF active>active<TMPL_ELSE>not active</TMPL_IF>

        <div>
            <button onclick="counterClick(<TMPL_VAR id>)">
                <span>Click me</span>
            </button>
            <span><TMPL_VAR counter></span>
        </div>
    </li>
</TMPL_BLOCK>

<div class="app">
    <h2><TMPL_VAR title></h2>

    <p><TMPL_VAR description></p>

    <ul class="list">
        <TMPL_LOOP people>
            <TMPL_INLINE BLOCK_NAME="Person" person
                p=[% $name %]
                active=[% $active %]>
        </TMPL_LOOP>
    </ul>

    <p><button onclick="addClick(<TMPL_VAR id>)">Add person</button></p>
    <p><button onclick="popClick(<TMPL_VAR id>)">Pop person</button></p>

    <div>
        <a href="<TMPL_VAR githubLink>"><TMPL_VAR githubLink></a>
    </div>
</div>
