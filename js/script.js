/* ============
    MAIN EDITOR
==============*/

    const worksheet = $("#worksheet").contents();

    $(document).ready(function(){
        // set height of the resizer
        $("#main").height(window.innerHeight);

        // default workspace
        initWS();

        // set up perfect scrollbar
        $('.accordion-scroll').each(function() {
            new PerfectScrollbar(this, {
                wheelSpeed: 2,
                wheelPropagation: true,
                minScrollbarLength: 20
            });
        })
    });

    // Column resizeable
    var splitobj = Split(["#sidebar","#worksheet-container"], {
        elementStyle: function (dimension, size, gutterSize) { 
            $(window).trigger('resize'); // Optional
            return {'flex-basis': 'calc(' + size + '% - ' + gutterSize + 'px)'}
        },
        gutterStyle: function (dimension, gutterSize) { return {'flex-basis':  gutterSize + 'px'} },
        sizes: [20,80],
        minSize: 100,
        gutterSize: 5,
        cursor: 'col-resize'
    });

    // on resize display new worksheet size
    $(".gutter").mousemove(function() {
        displayScreenSize();
    });
    $(window).resize(function() {
        displayScreenSize();
    });

    // keyboard shortcuts
    $(window).on('keydown', function(e) {
        // disable in text areas and inputs
        var targetType = e.target.tagName.toLowerCase();
        if(targetType != "textarea" && targetType != 'input') {
            switch (e.keyCode) {
                case 90:
                    // ctrl+z
                    $('#undo').trigger('click');
                    break;
                case 89:
                    // ctrl+y
                    $('#redo').trigger('click');
                    break;
            }
        }
    });

    // click on undo
    $('#undo').click(function(){
        // get backups
        var backUpUndo = getBackupLS('undo');
        var backUpRedo = getBackupLS('redo');
        var actSource = getCodeLS();
        // create array in case of null
        if(backUpUndo==null) {
            backUpRedo = [];
        }
        if(backUpRedo==null) {
            backUpRedo = [];
        }
        // relocalize active source code
        if(backUpUndo.length > 0) backUpRedo.unshift(actSource);
        actSource = backUpUndo.pop();
        worksheetHTML(actSource);
        // editor set value when the edit menu active
        if($('[href="#edit"]').hasClass("show"))
            editor.getDoc().setValue(html_beautify(actSource, {'indent_size': 1}));
        // save
        saveCodeLS('undo');
        setBackupLS(backUpUndo, 'undo');
        setBackupLS(backUpRedo, 'redo');
    });
    
    // click on redo
    $('#redo').click(function(){;
        // get backups
        var backUpUndo = getBackupLS('undo');
        var backUpRedo = getBackupLS('redo');
        var actSource = getCodeLS();
        // create array in case of null
        if(backUpUndo==null) {
            backUpUndo = [];
        }
        if(backUpRedo==null) {
            backUpRedo = [];
        }
        // relocalize active source code
        if(backUpUndo.length > 0) backUpUndo.push(actSource);
        actSource = backUpRedo.shift();
        worksheetHTML(actSource);
        // editor set value when the edit menu active
        if($('[href="#edit"]').hasClass("show"))
            editor.getDoc().setValue(html_beautify(actSource, {'indent_size': 1}));
        // save
        saveCodeLS('redo');
        setBackupLS(backUpUndo, 'undo');
        setBackupLS(backUpRedo, 'redo');
    });

    // click on clear all
    $('#deleteAllBtn').click(function(){
        // clear storages
        sessionStorage.clear();
        localStorage.clear();
        // init UI
        initWS();
        clearFields();
    });

/* ============
    INSERT ITEM MENU
==============*/

    $('.nav-item [href="#new"]').on('click', function(){
        // ini
        buildItemInsertMenu();
    });

    $('#new-item-search').on('keyup', function(){
        // search tag
        var query = $(this).val();
        buildItemInsertMenu(query);
    });

    // click to add html tag button
    $(document).on('click', '.htmlTagBtn', function(e){
        e.preventDefault();
        // click add button
        var senderBtnTxt = $(e.target).text().replace(/[</>]/g,'');
        // fill edit item field with clicked button
        $('#item2Edit').val(senderBtnTxt);
        // goto edit menu
        $('.nav-item [href="#edit"]').trigger('click');
    });

/* ============
    EDIT ITEM MENU
==============*/

    // on edit button click
    $('.nav-item [href="#edit"]').on('click', function(e){
        e.preventDefault();
        // code edit default
        if($('#item2Edit').val().length == 0) {
            // if item2Edit empty - show code editor
            $('[data-target="#code-edit"]').trigger('click'); 
        } else {
            // show item2Edit
            $('[data-target="#item_edit"]').trigger('click');
            $('#item_edit').addClass('show');
            $('#item2Edit').trigger('change', [true]);
        }
    });

    // show editor on click
    $(document).on('click', '.CodeMirror-scroll', function(){
        $('.CodeMirror').css('opacity', '1');
    });

    // on pipette button click
    $('.pipette').on('click', function(){
        const pipette = $(this);
        // pipette activate
        pipette.addClass('active');
        
        // set cursor on worksheet
        worksheet.find('html').css('cursor', 'crosshair');

        // click on workspace
        worksheet.on('click', function(e) { 
            const input = pipette.parent().siblings('input');
            const inputId = input.attr('id');

            // store selected object in session
            switch (inputId) {
                case "item2Edit":
                    // item to edit
                    setSession("item2Edit", e.target);
                    // set selected item tag to input
                    input.val(generateSelector(e.target));
                    // input changed signal
                    input.trigger('change');
                    break;     
                case "itemPlace":
                    // item place
                    setSession("itemPlace", e.target);
                    // set selected item selector to input
                    input.val(generateSelector(e.target));
                    // highlight selected element
                    highlightElement(e.target);
                    break;
                case "itemPlace":
                    // item place
                    setSession("itemPlace", e.target);
                    // set selected item selector to input
                    input.val(generateSelector(e.target));
                    // highlight selected element
                    highlightElement(e.target);
                    break;
                case "style-search":
                    var selector = generateSelector(e.target);
                    setSession("item2Edit", e.target);
                    // set selected item selector to input
                    input.val(selector);
                    // highlight selected element
                    highlightElement(e.target);
                    // open associated styles
                    loadStylesFromWS('',selector);
                    break;
                case "new-item-search":
                    var selector = generateSelector(e.target);
                    // set selected item tagname to input
                    input.val(getTagNameFromSelector(selector));
                    // input keyup signal to trigger search
                    input.trigger('keyup');
                    break;
            }
            // pipette deactive
            pipette.removeClass('active');  
            // click off
            worksheet.off();
            // cursor off
            worksheet.find('html').removeAttr("style");
        })
        
        // click elsewhere - turn off pipette mode
        $(document).on('mousedown', function(){
            // inactive button
            pipette.removeClass('active'); 
            // click off
            worksheet.off();
            // cursor off
            worksheet.find('html').removeAttr("style");
        })
    });

    // on item edit click
    $('[data-target="#item_edit"]').on('click', function(){
        sessionStorage.clear();

        // get worksheet html source
        var html = worksheetHTML();
    
        // collect all tags
        var tags = /<\w(\s*\w*)[^>\/]*\/?>/igm;
        tags = html.match(tags);

        // datalist clear
        $('#itemsFromWorksheet').empty();
        $('#itemPossiblePlaces').empty();
    
        // add existing tag selectors to options
        $.each(tags, function( key, tag ) {
            tag = generateSelector($(tag)[0]);
            $('#itemsFromWorksheet').append(`<option value="${tag}">`);
            $('#itemPossiblePlaces').append(`<option value="${tag}">`);
        });
    });

        // item2Edit value change
        $('#item2Edit').change(function(e, addNew = false){
            // input display only tagName 
            var selector = $(this).val();
            $(this).val(getTagNameFromSelector(selector));
            
            // load attribute datalist on item2insert value change
            loadAttrDatalist(selector);
            
            // reset fields
            resetAttrFields();
            
            var elementOnWorksheet = worksheet.find(selector);

            if(elementOnWorksheet.length != 0 && addNew == false) {
                // set session selected element
                setSession("item2Edit", elementOnWorksheet[0]);

                // fill attributes field
                var attrList = elementOnWorksheet[0].attributes;
                
                $.each(attrList, function(key, attr) {
                    if(attr.nodeName.substring(0,2) != 'on') {
                        // attribute
                        var attrField = $("#addAttr").prev().clone();
                        // set values
                        attrField.find('.attrN').val(attr.nodeName);
                        attrField.find('.attrV').val(attr.value);
                        // insert
                        attrField.insertBefore($("#addAttr"));
                    } else {
                        // event 
                        var attrField = $("#addEvnt").prev().clone();
                        // set values
                        attrField.find('.eventN').val(attr.nodeName);
                        attrField.find('.eventV').val(attr.value);
                        // insert
                        attrField.insertBefore($("#addEvnt"));
                    }
                });

                // auto select item place
                var place = getPlace(elementOnWorksheet);
                $("#itemPlace").val(generateSelector($(place)[0]));

                $("#itemContent").val( html_beautify( elementOnWorksheet.html(), {'indent_size': 1}) );

                highlightElement(elementOnWorksheet[0]);
            }
        });
            // load attribute value datalist on attr name change
            $(document).on('change', '.attrN, .eventN', function(){
                loadValDatalist($(this));
            });

            // load attribute value datalist on val field click
            $(document).on('focus', '.attrV, .eventV', function(){
                var val = $(this).val();
                loadValDatalist($(this).siblings('input'));
                $(this).val(val);
            });

        // add new attribute field
        $(document).on('click', '#addAttr, #addEvnt, #addProp', function(){
            // get attribute field template - prev element
            var attrField = $(this).prev().clone();
            // clear values
            attrField.find('input').val('');
            // reset placeholder
            attrField.find('.attrV').attr('placeholder', 'érték...');
            // add empty attribute field
            attrField.insertBefore($(this));
        });

        // remove attribute field
        $(document).on('click', '#delAttr, #delEvnt, #delProp', function(){
            // selector to parent element
            var parentClass = '.'+($(this).parent().parent()[0].className).replace(/\s/g,'.');
            if($(parentClass).length > 1) {
                // must be at least one input field
                $(this).parents(parentClass).remove();
            } 
        });

        // click to insert
        $('#insertItemBtn').on('click', function(e) {
            e.preventDefault();
            var tag2Insert = $("#item2Edit").val();
            var attributes = Object.assign(getAttributes('.attr'),getAttributes('.event'));
            var innerContent = $("#itemContent").val();
            var insertTo = $("#inserTo").val();
            var itemPlace = $("#itemPlace").val();

            insertTag(tag2Insert, attributes, innerContent, itemPlace, insertTo);

            clearFields();
        });

        // click to modify
        $('#modifyItemBtn').on('click', function(e) {
            e.preventDefault();
            var tag2Modify = getSession("item2Edit");
            var tag2Insert = $("#item2Edit").val();
            var attributes = Object.assign(getAttributes('.attr'),getAttributes('.event'));
            var innerContent = $("#itemContent").val();
            var insertTo = $("#inserTo").val();
            var itemPlace = $("#itemPlace").val();

            // delete old element
            deleteTag(tag2Modify);
            // add new
            insertTag(tag2Insert, attributes, innerContent, itemPlace, insertTo);

            clearFields();
        });

        // click to delete
        $('#deleteItemBtn').on('click', function(e) {
            e.preventDefault();
            var tag2Delete = getSession("item2Edit");
            if(getTagNameFromSelector(tag2Delete) == $("#item2Edit").val()) {
                deleteTag(tag2Delete);
                clearFields();
            }
        });

        // click to reset
        $('#refresh').on('click', function(){
            clearFields();
        });

    // worksheet source code editor
    var editor;

    // on code button click
    $('[data-target="#code-edit"]').on('click', function(e){
        e.preventDefault();
        // clear old code editor;
        $('#code-edit').children(':first').empty();
        // add new code editor
        $('#code-edit').children(':first').html('<form><textarea id="code" name="code"></textarea></form>');
        
        // set worksheet html to textarea
        var html = worksheetHTML();
        $('#code-edit').find('#code').val(html_beautify(html, {'indent_size': 1}));

        // textarea to text editor
        editor = CodeMirror.fromTextArea(document.getElementById("code"), {
            mode: "text/html",
            styleActiveLine: true,
            lineNumbers: true,
            lineWrapping: true,
            autoCloseTags: true,
            autoCloseBrackets: true,
            scrollbarStyle: "simple"
        });
        // fix row number
        var charWidth = editor.defaultCharWidth(), basePadding = 2;
        editor.on("renderLine", function(cm, line, elt) {
            var off = CodeMirror.countColumn(line.text, null, cm.getOption("tabSize")) * charWidth;
            elt.style.textIndent = "-" + off + "px";
            elt.style.paddingLeft = (basePadding + off) + "px";
        });
        editor.refresh();

        // code edit
        $("#codeSave").on('click', function(e){
            var code = editor.getValue();
            worksheetHTML(code);
            saveCodeLS();
        });
    });

/* ============
    STYLE MENU
==============*/
    // on style button click
    $('.nav-item [href="#style"]').on('click', function(e){
        e.preventDefault();
        sessionStorage.clear();
        $('#style-search').val('');
        loadStylesFromWS();
        loadStylePropDatalist();
    });

    // search style by query
    $('#style-search').on('keyup', function(e) {
        e.preventDefault();
        loadStylesFromWS($(this).val());
    });

    // click on head to modify
    $(document).on('click', '#style-manager .card-header button', function(e){
        e.preventDefault();
        // prev input change to button
        var input2button = $('#style-manager').find('#selectorButtonInput');
        if(input2button.length > 0) {
            var val = input2button.val().trim();
            var id = input2button.parent().attr('id');
            // strip H from id
            id = id.substring(0, id.length-1);
            var html = `<button type="text"class="btn btn-link w-100 h-100 bg-light" data-toggle="collapse" data-target="#${id}" aria-expanded="false" aria-controls="${id}">${val}</button>`;
            input2button.parent().html(html);
        }
        // act button change to input
        var text = $(this).text().trim();
        $(this).parent().html(`<input type="text" id="selectorButtonInput" class="form-control bg-gray text-center" placeholder="selector" value="${text}" old-value="${text}">`);
    })

    // store style in session on card click
    $(document).on('click', '#style-manager .card', function(e) {
        e.preventDefault();
        var styleSelector = $(this).find('.card-header input').attr('old-value');
        setSession('style2Edit', styleSelector, false);
    });

    
    // load property value datalist on attr name change
    $(document).on('change', '.propN', function() {
        resetPropValField($(this));
        loadStylePropValDatalist($(this));
    });

    // load property values on value field focus
    $(document).on('focus', '.propV', function() {
        var val = $(this).val();
        loadStylePropValDatalist($(this).siblings('input'));
        $(this).val(val);
    });

    // click on delete
    $(document).on('click', '#deleteStyleBtn', function(){
        var card = $(this).parents('.card');
        var styleSelector = card.find('.card-header input').val();
        if(styleSelector=="style") {
            // inline style attribute
            var item = getSession('item2Edit');
            if(item) {
                worksheet.find(item).removeAttr('style');
                saveCodeLS();
            }
        } else {
            // css style
            styleReplace(getSession('style2Edit'), '');
        }
        // hide deleted card
        card.fadeOut();
    });

    // click on save
    $(document).on('click', '#saveStyleBtn', function(){
        // get card
        var card = $(this).parents('.card');
        var styleSelector = card.find('.card-header input').val();
        // gather properties by class name 
        var propClass = card.find('.card-header input').attr('old-value');
        var properties = getAttributes(`.${stripSpec(propClass)}`);
        if(styleSelector=="style") {
            // inline style attribute
            var item = getSession('item2Edit');
            if(item) {
                var style = '';
                $.each(properties, function(prop, val) {
                    if(prop!=undefined && val!=undefined) style += `${prop}:${val};`
                });
                worksheet.find(item).attr('style', style);
            }
        } else {
            // css style
            // generate code
            var style = `${styleSelector} \{`;
            $.each(properties, function(prop, val) {
                if(prop!=undefined && val!=undefined) style += `${prop}: ${val};`
            });
            style += "}";

            // insert
            var selector = getSession('style2Edit');
            if(selector!='newStyle') {
                // modify
                styleReplace(selector, style);
            } else {
                // new
                if(worksheet.find('style').length == 0) {
                    // if there's no style tag on head
                    insertTag('style', '', style, 'head', 'parent');
                } else {
                    worksheet.find('style').first().append(style);
                }
            }
        }
        // delete session
        sessionStorage.clear();
        // reset display
        loadStylesFromWS();
    });

/* ============
    SAVE MENU
==============*/

    // save click
    $('.saveBTN').click(function(){
        // get filename
        const fileName = $(this).attr('title');
        // get source by filename
        const source = getSource(fileName);
        // create file
        const blob = new Blob([source], {type: "text/plain:charset=utf-8"});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.id = "downloadLink"
        a.href = url;
        a.download = fileName;
        // start download
        a.click();
        window.URL.revokeObjectURL(url);
        // destroy link
        $("#downloadLink").remove();
    });