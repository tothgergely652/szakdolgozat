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