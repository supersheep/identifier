var $ = require("sizzle");

function Identifier(doc){
    this.doc = doc || document;
    if(!Identifier.instance){
        Identifier.instance = this;
    }
}


/**
 *
 * @return 是否可以通过简单的选择器唯一的识别
 */
Identifier.prototype.onlyOne = function(selector){
    return $(selector,this.doc).length == 1;
}


Identifier.prototype.identifyMulti = function(elem){
    var parent = elem;
    var self = this;
    var body = this.doc.body;
    var results = [];
    var selectors = null;

    function exists(elems_to_match){
        return results.some(function(result){
            var elems = result.elems;
            var l = Math.max(elems.length,elems_to_match.length);
            for(var i = 0;i<l;i++){
                if(elems[i] != elems_to_match[i]){
                    return false;
                }
            }
            return true;
        });
    }

    function possible_selectors(elem){
        var selectors;
        if(elem.getAttribute("class")){
            selectors = self.getClasses(elem);
        }else{
            selectors = [elem.tagName.toLowerCase()];
        }
        return selectors;
    }

    function mix_selectors(arr1,arr2){
        var results = [];
        arr1.forEach(function(s1){
            arr2.forEach(function(s2){
                results.push([s1,s2].join(" "))
            });
        });
        return results;
    }

    function find_possible_sub_identify(selector){
        var elems = $(selector,parent)
        if(elems.length > 1 && !exists(elems)){
            results.push({
                selector:selector,
                parent:self.identifySingle(parent),
                elems:elems
            });
        }
    }


    while(parent !== body){
        parent = elem.parentNode;

        selectors = selectors || possible_selectors(elem);

        selectors.forEach(findPossibleSubIdentify);

        selectors = mix_selectors(possible_selectors(parent),selectors);
        elem = parent;
    }
    return results;
}

Identifier.prototype.getClasses = function(elem){
    return elem.getAttribute("class").trim().split(/\s+/).map(function(cls){return "."+cls});
}

Identifier.prototype.getClass = function(elem){
    return this.getClasses(elem).join("");
}

Identifier.prototype.traverseParent = function(elem,selector){
    var body = this.doc.body;
    var parent_selector;
    var new_selector;
    var parent = elem.parentNode;
    if(parent === body){
        return selector;
    }else{
        if(parent.getAttribute("class")){
            parent_selector = this.getClass(parent);
        }else{
            parent_selector = parent.tagName.toLowerCase();
        }

        new_selector = [parent_selector,selector].join(" ");
        if(this.onlyOne(new_selector)){
            return new_selector;
        }else{
            return [this.identifySingle(parent),selector].join(" ");
        }

    }
}

Identifier.prototype.identifySingle = function(elem){
    var selector;
    var doc = this.doc;
    if(elem.getAttribute("id")){
        selector = "#"+elem.getAttribute("id");
    }else if(elem.getAttribute("class")){
        selector = this.getClass(elem);
        if(!this.onlyOne(selector)){
            selector = this.traverseParent(elem,selector);
        }
    }else{
        selector = elem.tagName.toLowerCase();
        if(!this.onlyOne(selector)){
            selector = this.traverseParent(elem,selector);
        }
    }

    function getIndex(elem, selector){
        var el = $(selector,doc)[0];
        if(!el){return -1}
        var children = [];
        var childNodes = el.parentNode.childNodes;
        for(var i = 0; i < childNodes.length; i++){
            if(childNodes[i].nodeType !== 3){
                children.push(childNodes[i]);
            }
        }

        return children.indexOf(elem)+1;
    }

    if(!this.onlyOne(selector)){
        selector = selector + ":nth-child(" + getIndex(elem, selector) + ")";
    }
    return selector;
}


module.exports = Identifier;