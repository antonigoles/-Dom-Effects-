# 🧙‍♂️ **Dom Effects** (`Proof of Conept`)


> **Dom Effects** is a Framework that allows you to create interactive animated web interfaces faster than ever before!

<br>
<br>

---

##  📝 **Examples**

1. Basic Usage
    - This example will display a simple alert box with "whoomp" inside after pressing the `div` element
```HTML
<div 
    data-dom-effect='click:alert("whoomp")'
>
</div>
<script src="./dom-effects.js"></script>

<script>
    DomEffects.init();
</script>
</html>

```

2. Your own effects on event
    - **Dom Effects** checks for functions in global scope, so you can easily use them in your `dom effect scripts`
```HTML
<div 
    data-dom-effect='click:setColor("red")'
>
</div>
<script src="./dom-effects.js"></script>

<script>
    // a function definition requires "params" and "target" parameter
    // params - array of params defined in the script
    // target - a target (refernce to dom node) specified in script (defaults to the script owner element)
    function setColor(params, target) {
        const [ color ] = params;
        target.style["color"] = color;
    }

    DomEffects.init();
</script>
</html>

```

3. Reversible effects
    - Events like `hover`, require `reversible effects` (so that the framework knows how to comeback to a state before the event)
    - **TODO:** Make automatic state change reverse
```HTML

<div 
    data-dom-effect='hover:addClass("example-class")'
>
</div>
<script src="./dom-effects.js"></script>
<script>

function addClass(params, target) {
    const [ className ] = params;
    target.classList.add(className)
}

function removeClass(params, target) {
    const [ className ] = params;
    target.classList.remove(className)
}

DomEffects.registerReversableEffect(addClass, removeClass);

DomEffects.init();
</script>
</html>


```

<br>
<br>

---

## 🛑 **Read Before you use this framework!**
- It's not dynamic **yet**: The effects won't apply on dom nodes created after `DomEffects.init()` is called (To be changed in the dev/prod version)


<br>
<br>


### *...stuff*