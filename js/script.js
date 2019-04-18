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
        // editor set value
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
        // editor set value
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
     

/* ============
    FUNCTIONS
==============*/

    // set up workspace
    function initWS() {
        if(getCodeLS() == null) {
            // default source
            worksheetHTML(`
                <html>
                    <head>
                        <style>
                            .greeting {
                                text-decoration: underline;
                            }
                            h1 {
                                color: #010101;
                            }
                        </style>
                    </head>
                    <body>
                        <h1 id="hello" class="greeting">Hello World</h1>
                    </body>
                </html>
            `);
            saveCodeLS();        
        } else {
            // old code
            worksheetHTML(getCodeLS());
        }
        displayScreenSize();
    }

    // display/update worksheet size; 
    function displayScreenSize() {
        $('#size').text(Math.ceil($("#worksheet").width()) + "px × " + Math.ceil($("#worksheet").height()) + "px");
    }

    // get(-set) workspace html
    function worksheetHTML(code = null) {
        if(code != null) worksheet.find('html')[0].innerHTML = code;
        return worksheet.find('html')[0].outerHTML;
    }

    // prepare source to download
    function getSource(fileName) {
        var code = '';
        const styles = worksheet.find('style');
        var css = '';
        code = worksheetHTML();
        styles.each(function(key, style){
            // remove styles from source code and create css file
            css += $(style).text();
            if(key==0){
                code = code.replace(style.outerHTML, '<link rel="stylesheet" type="text/css" href="style.css">');
            } else {
                code = code.replace(style.outerHTML, '');
            }
        });
        if(fileName == 'index.html') {
            return html_beautify(code);
        }
        else if(fileName == 'style.css') {
            return css_beautify(css);
        }
    }

    // store html element selector in session
    function setSession(index, value, gSelector=true) {
        sessionStorage.setItem(index, (gSelector) ? generateSelector(value) : value);
    }

    // get stored html element
    function getSession(index) {
        return sessionStorage.getItem(index);
    }

    // save code in local storage
    function saveCodeLS(caller='') {
        // save old source in backup-undo
        var oldSource = (getCodeLS()!=null)?getCodeLS():worksheetHTML();
        // not undo click call this function
        if(caller!='undo') {
            var bu = getBackupLS('undo');
            if(bu == null) {
                bu = [];
            }
            bu.push(oldSource);
            setBackupLS(bu, 'undo');
        }
        // new source save
        localStorage.setItem('source', worksheetHTML());
        
        // clear redo storage if not redo call
        if(caller!="redo") {
            setBackupLS(null, 'redo');
        }
    }

    // get (act) code from local storage
    function getCodeLS() {
        return localStorage.getItem('source');
    }

    // put backup into local storage by type (redo, undo)
    function setBackupLS(arr, type) {
        localStorage.setItem(type, JSON.stringify(arr));
    }

    // get back up array of source codes - type  (redo, undo)
    function getBackupLS(type) {
        return JSON.parse(localStorage.getItem(type));
    }

    // generate selector from html object
    function generateSelector(element, eq=true) {
        var tagName = (element.tagName)?element.tagName.toLowerCase():'';
        var id = (element.id)?`#${element.id}`:'';
        // data from session eq
        var eqS = (element.eq)?`:${element.eq}`:'';
        var className = '';
        if(element.className) {
            element.className.split(" ").forEach(function(cn) {
                className += `.${cn}`;
            });
        }
        // TODO [attributes]
        var selector = `${tagName}${id}${className}`;
        if(worksheet.find(selector).length > 1 && eq) {
            if(eqS=='') {
                worksheet.find(selector).each(function(index, elem) {
                    // add index if selector has more result
                    if(elem === element) selector += `:eq(${index})`;
                });
            } else {
                selector += eqS;
            }
        }
        return selector;
    }

    // get sibling / parent of an element 
    function getPlace(element) {
        var ret;
        if($(element).prev().length > 0) {
            $("#inserTo").val('after');
            ret = $(element).prev();
        } else if($(element).next().length > 0) {
            $("#inserTo").val('before');
            ret = $(element).next();
        } else if($(element).parent().length) {
            $("#inserTo").val('parent');
            ret = $(element).parent();
        }
        return ret[0];
    }

    // hightlight selected element for 1.5 sec
    function highlightElement(elem) {
        var highlight = document.createElement('div');
        $(highlight)
            .attr('data-toggle', "tooltip")
            .attr('data-placement', "right")
            .attr('title', generateSelector(elem))
            .css('position', 'absolute')
            .css('top', $(elem).offset().top + $('#worksheet').offset().top)
            .css('left', $(elem).offset().left + $('#worksheet').offset().left)
            .css('width', $(elem).width())
            .css('height', $(elem).height())
            .css("border", "groove")
            .css("background", "#f8f8f880")
            .fadeIn().appendTo("#main")
            .tooltip('show')
            .delay(1500)
            .fadeOut(function() { 
                    $(this).tooltip('hide'); 
                    $(this).remove(); 
                });
    }

    // insert new tag
    function insertTag(tag2Insert, attributes, innerContent, itemPlace, insertTo) {
        // find item location on worksheet
        var target = worksheet.find(itemPlace);

        // create new element
        var newElem = document.createElement(tag2Insert); 
        $.each(attributes, function(attr, val) {
            if(attr!=undefined && val!=undefined) newElem.setAttribute(attr, val);
        });
        newElem.innerHTML = innerContent;

        // insert
        switch (insertTo) {
            case "parent":
                $(newElem).appendTo(target);
                break;
            case "before":
                $(newElem).insertBefore(target);
                break;
            case "after":
                $(newElem).insertAfter(target);
                break;
        }
        saveCodeLS();
    }

    // delete tag 
    function deleteTag(tag2Delete) {
        worksheet.find(tag2Delete).remove();
        saveCodeLS();
    }

    // get attributes by parent class
    function getAttributes(pclass) {
        var attributes = {}
        $(pclass).each(function() {
            var attrName = $(this).find(pclass+"N").val();
            var attrValue = $(this).find(pclass+"V").val();
            if(!(attrName == '' || attrValue == '')) {
                attributes[attrName] = attrValue;
            }
        });
        return attributes;
    }

    // clear input fields on edit menu
    function clearFields() {
        $("input, textarea, select").val('');
        sessionStorage.clear();
        resetAttrFields();
    }

    // reset fields
    function resetAttrFields() {
        var attrs = $("#addAttr").siblings(".attr");
        for (let i = attrs.length; i >= 1; i--) {
            $(attrs[i]).remove();
        }
        $(attrs[0]).find('.attrV').attr('placeholder', 'érték...');
        var evnt = $("#addEvnt").siblings(".event");
        for (let i = evnt.length; i >= 1; i--) {
            $(evnt[i]).remove();
        }
    }

    // reset property value field (remove colorpicker, placeholder etc...)
    function resetPropValField(propNameField) {
        const input = $(propNameField).siblings(".propV");
        var prev = input.prev();
        var classes = input[0].className;
        // remove picker
        classes = classes.replace('jscolor {refine:false,hash:true}','');
        var val = input.val();
        input.remove();
        $(`<input type="text" class="${classes}" list="propV" value="${val}" placeholder="érték...">`).insertAfter(prev);
    }

    // get tag name from selector
    function getTagNameFromSelector(selector) {
        var dot = (selector.indexOf('.')!=-1)?selector.indexOf('.'):'9999';
        var hash = (selector.indexOf('#')!=-1)?selector.indexOf('#'):'9999';
        var bracket = (selector.indexOf('[')!=-1)?selector.indexOf('['):'9999';
        var colon = (selector.indexOf(':')!=-1)?selector.indexOf(':'):'9999';
        // get closest attribut beginnings
        var endOfTag = Math.min(dot, hash, bracket, colon);
        if(endOfTag == 9999) {
            // there's no other attributes than name
            return selector;
        } else {
            // return tag name
            return selector.substring(0, endOfTag);
        }
    }

    // load styles from worksheet
    function loadStylesFromWS(query='', elementSelector='') {
        // array to display query result
        var result = [];
        if(elementSelector=='') {
            // list by query or worksheet elements
            var sheets = worksheet[0].styleSheets;
            $.each( sheets, function( i, sheet ){
                var rules = sheet.rules || sheet.cssRules;
                $.each( rules, function( i, rule ){
                    if(rule.cssText.includes(query)) {
                        result.push(rule.cssText);
                    }
                });
            });
        } else {
            // list by clicked element
            var element = worksheet.find(elementSelector)[0];
            var rules = MEJSX.getCustomCssRulesOnElement(element);
            $.each( rules, function( i, sheet) {
                result.push(sheet.content);
            });
        }
        
        $('#style-manager').empty();
        // add new style form
        var addNewStyleForm = buildAccordion(
            'style-manager', 
            "newStyle", 
            buildPropertyInput("newStyle") + `<button id="addProp" class="btn btn-outline-secondary border-0 btn-sm mb-2 ml-auto" type="button" data-toggle="tooltip" data-placement="top" title="Hozzáadás..."><i class="fas fa-plus"></i></button><div class="clearfix"></div>
            <div class="w-100"><button type="button" id="saveStyleBtn" class="btn btn-outline-secondary my-1 float-right">Mentés</button></div>`, 
            true, 
            true
        );
        $('#style-manager').append(addNewStyleForm);
        // display query result
        if(result.length > 0) {
            var resultShow = (query!='' || elementSelector!='');
            var html = '';
            for (let i = 0; i < result.length; i++) {
                // separate selector and content
                var selector = new RegExp('(.?)*\{', 'ig');
                selector = result[i].match(selector);
                selector = selector[0].replace(/\{|\s/ig, ''); 
                var content = new RegExp('\{(.?)*\}', 'ig');
                content = result[i].match(content);
                content = content[0].replace(/\{|\}/ig, ''); 
                
                // property inputs
                var properties = '';
                $.each( content.split(';'), function(key, css) {
                    if(css.length > 1) {
                        css = css.split(':');
                        cssProp = css[0].trim();
                        cssVal = css[1].trim();
                        properties += buildPropertyInput(selector, cssProp, cssVal);
                    }
                });
                // an empty property input
                properties += buildPropertyInput(selector);

                // add buttons and modal
                var modalId = stripSpec(selector);
                properties += `
                    <button id="addProp" class="btn btn-outline-secondary border-0 btn-sm mb-2 ml-auto" type="button" data-toggle="tooltip" data-placement="top" title="Hozzáadás..."><i class="fas fa-plus"></i></button>
                    <div class="clearfix"></div>
                    <div class="w-100">
                    <button type="button" class="btn btn-outline-secondary my-1 float-left" data-toggle="modal" data-target="#${modalId}Modal">Törlés</button>
                    <button type="button" id="saveStyleBtn" class="btn btn-outline-secondary my-1 float-right">Mentés</button>

                        <div class="modal fade" id="${modalId}Modal" tabindex="-1" role="dialog"
                            aria-labelledby="${modalId}ModalLabel" aria-hidden="true">
                            <div class="modal-dialog" role="document">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title py-2" id="${modalId}ModalLabel">
                                            Megerősítés</h5>
                                        <button type="button" class="close" data-dismiss="modal"
                                            aria-label="Close">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div class="modal-body">
                                        Biztos törli ezt a stílust?
                                    </div>
                                    <div class="modal-footer py-2">
                                        <button type="button" class="btn btn-outline-secondary btn-sm" data-dismiss="modal">Mégsem</button>
                                        <button type="button" class="btn btn-outline-danger btn-sm" id="deleteStyleBtn" data-dismiss="modal">Mehet</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                `;
                var html = buildAccordion('style-manager', selector, properties, resultShow, (resultShow)?true:false);
                $('#style-manager').append(html);
            }
        }
    }

    // style replace
    function styleReplace(oldSelector, newStyle) {
        // generate regex
        var selector = oldSelector + '.*\\{([\\S\\s]*?)\\}';
        style = new RegExp(selector,"g");
        // get source
        var source = worksheetHTML();
        // delete style in source
        source = source.replace(style, newStyle);
        // save
        worksheetHTML(source);
        saveCodeLS();
        // delete session
        sessionStorage.clear();
    }

    // build property input
    function buildPropertyInput(parent='', name='', val='') {
        // strip special characters because it will be identified by class name 
        parent = stripSpec(parent);
        var input = `
            <div class="input-group input-group-sm mb-1 prop ${parent}">
                <div class="input-group-prepend">
                    <button class="btn btn-outline-secondary" type="button" id="delProp"
                        data-toggle="tooltip" data-placement="top" title="Törlés..."><i
                            class="fas fa-minus fa-xs"></i></button>
                </div>
                <input type="text" class="propN ${parent}N form-control" list="propN" value="${name}"
                    placeholder="tulajdonság...">
                <div class="input-group-prepend">
                    <span class="input-group-text">:</span>
                </div>
                <input type="text" class="propV ${parent}V form-control" list="propV" value="${val}"
                    placeholder="érték...">
            </div>
        `;
        return input;
    }

    // strip special characters from selector 
    function stripSpec(selector) {
        return selector.replace(/[\#\.\[\]\<\>\:]/ig,'');
    }

    // load attribute datalist from json
    function loadAttrDatalist(tagName) {
        // clear old datalists
        $('datalist#attrN').empty();
        $('datalist#attrV').empty();
        $('datalist#eventN').empty();

        $.getJSON( "data/attr.json", function( attributes ) {
            $.each( attributes, function( attr, prop ){
                // attribute has elements property
                if(prop.hasOwnProperty('elements')) {
                    // elements include tag name or all
                    if(Object.values(prop['elements']).includes(tagName) || Object.values(prop['elements']).includes('all')){
                        // add to datalist
                        if(attr.substring(0,2) != 'on'){
                            // attribute
                            $('datalist#attrN').append(`<option value="${attr}">`);
                        } else {
                            // event
                            $('datalist#eventN').append(`<option value="${attr}">`);
                        }
                    }
                }
            });
        });
    }

    // load attribute values datalist from json
    function loadValDatalist(attrNameField) {
        const attrName = attrNameField.val();
        const datalist =  $('datalist#attrV');
        const input = $(attrNameField).siblings(".attrV");
        // clear old datalists
        datalist.empty();

        // reset field to default
        input.attr('type', 'text');
        if(input.hasClass('invisible')){
            // set visible
            input.removeClass('invisible');
            input.prev().removeClass('invisible');
        } 
        input.attr('placeholder', 'érték...');
        input.val('');

        $.getJSON( "data/attr.json", function( attributes ) {
            if(attributes[attrName]["placeholder"] != undefined) {
                // set placeholder
                input.attr('placeholder', attributes[attrName]["placeholder"][0] );
                // set number input
                if(attributes[attrName]["placeholder"] == 'number') {
                    input.attr('type', 'number');
                }
            }
            if(attributes[attrName]["placeholder"] == undefined && attributes[attrName]["values"] == undefined) {
                // attr has no value
                input.addClass('invisible');
                input.prev().addClass('invisible');
            }

            // set datalist
            if(attributes[attrName]["values"] != undefined) {
                $.each( attributes[attrName]["values"], function( key, val ) {
                    datalist.append(`<option value="${val}">`);
                });
            }
        });
    }

    // load style properties from json
    function loadStylePropDatalist() {
         // clear old datalists
         $('datalist#propN').empty();
 
         $.getJSON( "data/cssStyle.json", function( properties ) {
            $.each( properties, function( prop ){
                $('datalist#propN').append(`<option value="${prop}">`);
            });
         });
    }

    // load style properties value from json
    function loadStylePropValDatalist(propNameField) {
        const propName = propNameField.val();
        const datalist =  $('datalist#propV');
        const input = $(propNameField).siblings(".propV");
        // clear old datalists
        datalist.empty();

        if(propName.length > 0) {
            $.getJSON( "data/cssStyle.json", function( properties ) {
                    if(properties[propName]["placeholder"] != undefined) {
                        // set placeholder
                        input.attr('placeholder', properties[propName]["placeholder"][0] );
                        // set color input
                        if(properties[propName]["placeholder"][0] == 'color') {
                            jscolor.installByClassName('jscolor');
                            input.addClass('jscolor {refine:false,hash:true}');
                        }
                    }
                    // set datalist
                    if(properties[propName]["values"] != undefined) {
                        $.each( properties[propName]["values"], function( key, val ) {
                            datalist.append(`<option value="${val}">`);
                    });
                }
            });
        }
    }

    // set up insert menu from json
    function buildItemInsertMenu(query='.*') {
        // clear old menu
        $('#new-item-insert').empty();
        // prepare to filter with query
        var regex = new RegExp(query, "i");
        var queryEmpty = ((query=='.*') || (query==''));
        // load data from json
        $.getJSON( "data/htmlTags.json", function( dataset ) {
            $.each( dataset, function( category ){
                // build result array
                var names = [];
                $.each( dataset[category], function( key, value ){
                    if ((value.Name.search(regex) != -1)) {
                        names.push(value.Name);
                    }
                });
                // display array
                if(names.length > 0) {
                    var buttons = '';
                    $.each( names, function(key, name ){
                        // add button(s)
                        buttons += `<button type="button" class="htmlTagBtn btn btn-outline-secondary m-1">&lt;${name}&gt;</button>`;
                    });
                    var html = buildAccordion('new-item-insert', category, buttons, (!queryEmpty));
                    $('#new-item-insert').append(html);
                }
            });
        });    
    }

    // build accordion menu
    function buildAccordion(parentId, id, content, show, input=false) {
        // if new style title isn't equal to id
        var title = (id!="newStyle")?id:"Új hozzáadása";
        // replace secial chars
        id = id.replace(/\#/ig,'_hsh_');
        id = id.replace(/\./ig,'_dot_');
        id = id.replace(/\:/ig,'_colon_');
        // input or button on header
        var input_button = (input) ? `<input type="text" id="selectorButtonInput" class="form-control bg-gray text-center" placeholder="selector" value="${title}" old-value="${id}">` : `<button editable class="btn btn-link w-100 h-100 bg-light" data-toggle="collapse" data-target="#${id}" aria-expanded="${(show)?'true':'false'}" aria-controls="${id}">${title}</button>`;
        accordion = `
            <div class="card border-0 rounded-0">
                <div class="card-header p-0" id="${id}H">
                    ${input_button}
                </div>
                <div id="${id}" class="collapse ${(show)?'show':''}" aria-labelledby="${id}H" data-parent="#${parentId}">
                    <div class="card-body bg-light-gray border-secondary border-top border-bottom d-flex justify-content-center flex-wrap">    
                        ${content}
                    </div>
                </div>
            </div>
        `;   
        
        return accordion;
    }