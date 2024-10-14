

const graph = document.getElementById("graph")
const df1 = document.getElementById("df1")
const df2 = document.getElementById("df2")
const df3 = document.getElementById("df3")
const a = document.getElementById("a")
const b = document.getElementById("b")
const c = document.getElementById("c")
const d = document.getElementById("d")
const k = document.getElementById("k")
const xslider = document.getElementById("xderivslider")
const xinput = document.getElementById("xderivinput")
const derivinfo = document.getElementById("derivinfo")
const ty = document.getElementById("ty")
const derivativeDiv = document.getElementById("derivative")
const graphingDiv = document.getElementById("functions")
const switchtoderiv = document.getElementById("switchtoderiv")
const switchtographing = document.getElementById("switchtographing")
const backtoorigin = document.getElementById("origin")
const toggleui = document.getElementById("toggleui")
const slope = document.getElementById("slope")

const MARGIN = 0
const LINE_THICKNESS = 1
const AXIS_LINE_THICKNESS = 2
let LINES = 1000 // no longer a constant because it is reset later
const TEXT_HEIGHT = 18
const STROKE_WIDTH = 5
const NUM_CLAMP_PADDING = 5
const SUBDIVISIONS = 2
const ZOOM_RATE = 0.06
const FUNC_COUNT = 5

let position = [0,0]
let lastPosition = [0,0] // for dragging
let zoom = 15
let dragging = null
const startTime = Date.now()
let derivativeMode = true
let uienabled = true

const graphCtx = graph.getContext("2d")

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

function clamp(num,min,max){
    return Math.min(Math.max(num,min),max)
}

function toScientificNotation(num) {
    let split = num.toExponential().split("e")
    split[1] = parseInt(split[1])
    // modified to get rid of superscripts since they didnt work when uploaded to aws for some reason
    let superscript = split[1].toString().replace(/./g, char => {
        // const superscripts = {"-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹"}
        const superscripts = {"-": "-", "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9"}
        if(split[1]==1){
            return ""
        }
        return superscripts[char]
    })
    const precision = Math.pow(10,3)
    return `${Math.round(split[0]*precision)/precision} x 10^${superscript}`
    // return `${Math.round(split[0]*precision)/precision} × 10${superscript}`
}

function getTimeElapsed(){
    const precision = Math.pow(10,3)
    return Math.floor(((Date.now()-startTime)/1000)*precision)/precision
}

function updateGraph(){
    graph.width = window.innerWidth - MARGIN*2
    graph.height = window.innerHeight - MARGIN*2

    LINES = graph.width/4

    graph.style.width = graph.width+"px"
    graph.style.height = graph.height+"px"

    graph.style.margin = MARGIN+"px"

    xslider.min = -zoom
    xslider.max = zoom
    // graph.style.width = `400px`
    // graph.style.height = `400px`

    // graph.width = 400
    // graph.height = 400

    // console.log(graph.height)
    let modifier = Math.pow(10,Math.floor(Math.log10(zoom)))
    let log10base = zoom/modifier

    if(log10base>4){
        log10base /= 4
    }else if(log10base>2){
        log10base /= 2
    }

    const lineCount = 2.5*(graph.width>4000?4:(graph.width>1350?2:(graph.width>650?1:(graph.width>350?0.5:(graph.width>175?0.25:0.125)))))
    log10base *= lineCount

    const AR = graph.height/graph.width
    let vertlog10base = log10base*AR
    let vertzoom = zoom*AR
    // console.log((log10base/lineCount*modifier)/zoom)
    // console.log(zoom-(position[0]/graph.width*2*zoom))
    // const modifiedBounds = [position[0]/(graph.width/2)*zoom,position[1]/graph.height*2*zoom*AR]
    for(let i=0;i<=Math.ceil(log10base)+1;i++){
        let scroll = graph.width/2*(i/log10base)
        let offset = ((position[0])%(graph.width/2/log10base))

        const precision = Math.pow(10,7)
        let rawPos = i/log10base*zoom
        let offsetPos = Math[position[0]<0?"floor":"ceil"](-position[0]/(graph.width/2)*log10base)/log10base*zoom
        let posR = rawPos+offsetPos
        let posL = -rawPos+offsetPos
        let exponentialDecimals = 5
        let textR,textL
        if(Math.floor(Math.log10(zoom/log10base))<-(exponentialDecimals+1) || Math.floor(Math.log10(zoom/log10base))>exponentialDecimals){
            if(posR!=0){
                textR = toScientificNotation(posR)
            }else{
                textR = "0"
            }
            if(posL!=0){
                textL = toScientificNotation(posL)
            }else{
                textL = "0"
            }
        }else{
            textR = (Math.round(posR*precision)/precision).toString()
            textL = (Math.round(posL*precision)/precision).toString()
        }

        let textWidthR = graphCtx.measureText(textR).width+2
        let textWidthL = graphCtx.measureText(textL).width+2
        const textOffset = [6,6]
        // console.log((i+(offsetPos/zoom*log10base)))
        // graphCtx.fillStyle = "#D3D3D3"
        graphCtx.fillStyle = (i+(offsetPos/zoom*log10base))%4==0?"black":"#D3D3D3"
        // console.log(offsetPos/zoom*log10base)
        graphCtx.fillRect(graph.width/2+scroll+offset,0,LINE_THICKNESS,graph.height)
        if(i!=0){
            graphCtx.fillStyle = (-i+(offsetPos/zoom*log10base))%4==0?"black":"#D3D3D3"
            graphCtx.fillRect(graph.width/2-scroll+offset,0,LINE_THICKNESS,graph.height)
        }
        for(let d=0;d<SUBDIVISIONS;d++){
            graphCtx.fillStyle = "#D3D3D3"
            graphCtx.fillRect(graph.width/2+(graph.width/2*((i+(d+1)/SUBDIVISIONS)/log10base))+offset,0,LINE_THICKNESS,graph.height)
            graphCtx.fillRect(graph.width/2-(graph.width/2*((i+(d+1)/SUBDIVISIONS)/log10base))+offset,0,LINE_THICKNESS,graph.height)
        }
        graphCtx.textAlign = "center"
        graphCtx.textBaseline = "middle"
        graphCtx.font = `${TEXT_HEIGHT}px serif`
        graphCtx.strokeStyle = "white"
        graphCtx.fillStyle = "black"
        graphCtx.lineWidth = STROKE_WIDTH
        // graphCtx.fillRect(graph.width/2+scroll+offset-textWidthR/2+(posR!=0?0:(-textWidthR/2-textOffset[0])),graph.height/2+position[1]+textOffset[1],textWidthR*2,TEXT_HEIGHT)
        const rArgs = [textR, graph.width/2+scroll+offset+(posR!=0?0:(-textWidthR/2-textOffset[0])),clamp(graph.height/2+position[1]+(TEXT_HEIGHT/2+textOffset[1]),TEXT_HEIGHT/2+NUM_CLAMP_PADDING,graph.height-TEXT_HEIGHT/2-NUM_CLAMP_PADDING),graph.width/2/log10base]
        graphCtx.strokeText(...rArgs)
        graphCtx.fillText(...rArgs)
        if(i!=0){
            // graphCtx.fillRect(graph.width/2-scroll+offset-textWidthL/2+(posL!=0?0:(-textWidthL/2-textOffset[0])),graph.height/2+position[1]+textOffset[1],textWidthL*2,TEXT_HEIGHT)
            const lArgs = [textL, graph.width/2-scroll+offset+(posL!=0?0:(-textWidthL/2-textOffset[0])),clamp(graph.height/2+position[1]+(TEXT_HEIGHT/2+textOffset[1]),TEXT_HEIGHT/2+NUM_CLAMP_PADDING,graph.height-TEXT_HEIGHT/2-NUM_CLAMP_PADDING),graph.width/2/log10base]
            graphCtx.strokeText(...lArgs)
            graphCtx.fillText(...lArgs)
        }
    }
    for(let i=0;i<=Math.ceil(vertlog10base)+1;i++){
        let scroll = graph.height/2*(i/vertlog10base)
        let offset = ((position[1])%(graph.height/2/vertlog10base))

        const precision = Math.pow(10,7)
        let rawPos = i/vertlog10base*vertzoom
        let offsetPos = Math[position[1]<0?"floor":"ceil"](-position[1]/(graph.height/2)*vertlog10base)/vertlog10base*vertzoom
        let posR = -rawPos-offsetPos
        let posL = rawPos-offsetPos
        let exponentialDecimals = 5
        let textR,textL
        if(Math.floor(Math.log10(vertzoom/vertlog10base))<-(exponentialDecimals+1) || Math.floor(Math.log10(vertzoom/vertlog10base))>exponentialDecimals){
            if(posR!=0){
                textR = toScientificNotation(posR)
            }else{
                textR = "0"
            }
            if(posL!=0){
                textL = toScientificNotation(posL)
            }else{
                textL = "0"
            }
        }else{
            textR = (Math.round(posR*precision)/precision).toString()
            textL = (Math.round(posL*precision)/precision).toString()
        }

        let textWidthR = graphCtx.measureText(textR).width
        let textWidthL = graphCtx.measureText(textL).width
        const textOffset = [6,6]
        // console.log((i+(offsetPos/vertzoom*vertlog10base)))
        // graphCtx.fillStyle = "#D3D3D3"
        graphCtx.fillStyle = (i+(offsetPos/vertzoom*vertlog10base))%4==0?"black":"#D3D3D3"
        // console.log(offsetPos/vertzoom*vertlog10base)
        graphCtx.fillRect(0,graph.height/2+scroll+offset,graph.width,LINE_THICKNESS)
        if(i!=0){
            graphCtx.fillStyle = (-i+(offsetPos/vertzoom*vertlog10base))%4==0?"black":"#D3D3D3"
            graphCtx.fillRect(0,graph.height/2-scroll+offset,graph.width,LINE_THICKNESS)
        }
        for(let d=0;d<SUBDIVISIONS;d++){
            graphCtx.fillStyle = "#D3D3D3"
            graphCtx.fillRect(0,graph.height/2+(graph.height/2*((i+(d+1)/SUBDIVISIONS)/vertlog10base))+offset,graph.width,LINE_THICKNESS)
            graphCtx.fillRect(0,graph.height/2-(graph.height/2*((i+(d+1)/SUBDIVISIONS)/vertlog10base))+offset,graph.width,LINE_THICKNESS)
        }
        graphCtx.textAlign = "center"
        graphCtx.textBaseline = "middle"
        graphCtx.font = `${TEXT_HEIGHT}px serif`
        graphCtx.strokeStyle = "white"
        graphCtx.fillStyle = "black"
        graphCtx.lineWidth = STROKE_WIDTH
        // if(i!=0){
        //     graphCtx.fillRect(graph.width/2+position[0]-textOffset[0]-textWidthR,graph.height/2-scroll+offset-TEXT_HEIGHT/2,textWidthL,TEXT_HEIGHT)
        //     graphCtx.fillRect(graph.width/2+position[0]-textOffset[0]-textWidthL,graph.height/2+scroll+offset-TEXT_HEIGHT/2,textWidthR,TEXT_HEIGHT)
        // }

        if(textR!="0"){
            const rArgs = [textR,clamp(graph.width/2+position[0]-textOffset[0]-textWidthR/2,textWidthR/2+NUM_CLAMP_PADDING,screen.width-textWidthR/2-NUM_CLAMP_PADDING),graph.height/2+scroll+offset,graph.height/2/vertlog10base]
            // graphCtx.fillRect(graph.width/2+position[0]-textOffset[0]-textWidthR,graph.height/2+scroll+offset-TEXT_HEIGHT/2,textWidthR*2,TEXT_HEIGHT)
            graphCtx.strokeText(...rArgs)
            graphCtx.fillText(...rArgs)
        }
        if(i!=0 && textL!="0"){
            const lArgs = [textL,clamp(graph.width/2+position[0]-textOffset[0]-textWidthL/2,textWidthR/2+NUM_CLAMP_PADDING,screen.width-textWidthR/2-NUM_CLAMP_PADDING),graph.height/2-scroll+offset,graph.height/2/vertlog10base]
            // graphCtx.fillRect(graph.width/2+position[0]-textOffset[0]-textWidthL,graph.height/2-scroll+offset-TEXT_HEIGHT/2,textWidthL*2,TEXT_HEIGHT)
            graphCtx.strokeText(...lArgs)
            graphCtx.fillText(...lArgs)
        }
    }
    // for(let i=0;i<=Math.ceil(log10base*AR);i++){
    //     graphCtx.fillStyle = "black"
        
    //     graphCtx.fillRect(0,graph.height/2+(graph.height/2*((i)/(log10base*AR)))+((position[1])%(graph.height/2*(1/(log10base*AR)))),graph.width,1)
    //     graphCtx.fillRect(0,graph.height/2-(graph.height/2*((i)/(log10base*AR)))+((position[1])%(graph.height/2*(1/(log10base*AR)))),graph.width,1)
    // }

    graphCtx.fillRect(graph.width/2+position[0],0,3,graph.height)
    graphCtx.fillRect(0,graph.height/2+position[1],graph.width,3)

    updateFunctions()
    // console.log(zoom*AR*position[1]/graph.height*2)
    
    // graphCtx.fillRect(0,graph.height/2-AXIS_LINE_THICKNESS/2,graph.width,AXIS_LINE_THICKNESS)
}

function updateFunctions(){
    const AR = graph.height/graph.width
    const time = getTimeElapsed()
    function drawFunction(element,divName){
        let compiledfunc
        try{
            compiledfunc = math.parse(element.value).compile()
        }catch{}
        if(compiledfunc){
            let varsToPass = {
                "t": time,
                "a": a.value,
                "b": b.value,
                "c": c.value,
                "d": d.value,
                "k": k.value,
            }
            if(derivativeMode){
                varsToPass["tx"] = xinput.value
                varsToPass["ty"] = calcty()
            }
            for(let i=0;i<LINES;i++){
                // let modifiedXBounds = [zoom+(position[0]/(graph.width/2)*zoom),-zoom-(position[0]/(graph.width/2)*zoom)]
        
                const startLocalX = i/LINES
                const stopLocalX = (i+1)/LINES
        
                const leftBounds = -zoom*(1+position[0]/(graph.width/2))
                const startX = leftBounds+(startLocalX*zoom*2)
                const stopX = leftBounds+(stopLocalX*zoom*2)
                function fofx(x){
                    // console.log((Date.now()-aaaa)/1000/2)
                    let yVal
                    varsToPass["x"] = x
                    try{
                        let computed = compiledfunc.evaluate(varsToPass)
                        let computedFloat = parseFloat(computed)
                        if(String(computedFloat)==computed){
                            yVal = computedFloat
                        }
                    }catch{}
                    return yVal
                    // return Math.tan(x)
                    // return math.evaluate("tan(x)",{
                    //     "x": x
                    // })
                }
                const startY = fofx(startX)
                const stopY = fofx(stopX)
                if(startY!=null && stopY!=null){
                    const topBounds = zoom*AR*(1+position[1]/graph.height*2)
        
                    const renderedStart = [startLocalX*graph.width,(topBounds-startY)/(zoom*2*AR)*graph.height]
                    const renderedStop = [stopLocalX*graph.width,(topBounds-stopY)/(zoom*2*AR)*graph.height]
                    // console.log(window.getComputedStyle(document.getElementById("function"+func)).outlineColor)
                    graphCtx.strokeStyle  = window.getComputedStyle(document.getElementById(divName)).outlineColor
                    graphCtx.lineWidth = 2
            
                    graphCtx.beginPath()
                    graphCtx.moveTo(renderedStart[0],renderedStart[1])
                    graphCtx.lineTo(renderedStop[0],renderedStop[1])
                    graphCtx.stroke()
                }
            }
        }
    }
    if(derivativeMode){
        for(let func=1;func<=3;func++){
            let element = document.getElementById("df"+func)
            let checked = document.getElementById("checkdf"+func)
            // console.log(element.value)
            if(element && element.value.length>0 && checked && checked.checked){
                drawFunction(element,"dfunction"+func)
            }
        }
    }else{
        for(let func=1;func<=FUNC_COUNT;func++){
            let element = document.getElementById("f"+func)
            let checked = document.getElementById("checkf"+func)
            // console.log(element.value)
            if(element && element.value.length>0 && checked && checked.checked){
                drawFunction(element,"function"+func)
            }
        }
    }
}

function calcty(){
    const precision = Math.pow(10,8)
    let computed = math.evaluate(df1.value,{
        "x": xinput.value,
        "a": a.value,
        "b": b.value,
        "c": c.value,
        "d": d.value,
        "k": k.value,
    })
    let computedFloat = parseFloat(computed)
    if(String(computedFloat)==computed){
        return Math.round(computedFloat*precision)/precision
    }else{
        return 0/0
    }
}

function calculateSlope(){
    const precision = Math.pow(10,8)
    let computed = math.evaluate(df2.value,{
        "x": xinput.value,
        "a": a.value,
        "b": b.value,
        "c": c.value,
        "d": d.value,
        "k": k.value,
    })
    let computedFloat = parseFloat(computed)
    if(String(computedFloat)==computed){
        return Math.round(computedFloat*precision)/precision
    }else{
        return 0/0
    }
}

function calculateTanLine(){
    let tanLine
    let calculatedty = calcty()
    if(isNaN(calculatedty)){
        calculatedty = "DNE"
        slope.value = "DNE"
    }else if(df2.value!=""){
        tanLine = `(${df2.value.replaceAll("x","tx")}) * (x - tx) + ty` // y-y2=m(x-x2)
        let calculatedSlope = calculateSlope()
        slope.value = isNaN(calculatedSlope) ? "DNE" : calculatedSlope
    }else{
        slope.value = "DNE"
    }
    ty.value = calculatedty
    if(tanLine){
        df3.value = tanLine
    }else{
        df3.value = ""
    }
    updateGraph()
    // let tangentLine = math.evaluate(`(${deriv})*(x-)`)
}

function derivativeInputUpdate(){
    let deriv
    try{
        deriv = math.derivative(df1.value,"x")._toString() // derivative with respect to x
    }catch{}
    if(deriv!=null){
        df2.value = deriv
    }else{
        df2.value = ""
    }
    calculateTanLine()
}

window.addEventListener("resize", updateGraph)

graph.addEventListener("mousedown",(event)=>{
    // console.log(event)
    dragging = [event.x,event.y]
    updateGraph()
})

addEventListener("mouseup",(event)=>{
    // console.log(event)
    lastPosition = position
    dragging = null
    updateGraph()
})

addEventListener("mousemove",(event)=>{
    if(dragging){
        position = [lastPosition[0]+event.x-dragging[0],lastPosition[1]+event.y-dragging[1]]
        // console.log(position)
        updateGraph()
        // graphCtx.fillRect(graph.width/2+position[0],graph.height/2+position[1],50,50)
        updateGraph()
    }
})

addEventListener("wheel",(event)=>{
    const scalar = 1+(event.deltaY/100*ZOOM_RATE)
    if((event.deltaY>0&&zoom<Math.pow(10,300))||(event.deltaY<0&&zoom*scalar>0.00001)){ // limit as 64 bit integer, if this check wasn"t in place it would freeze and i wouldnt be able to update zoom, could be 308 but made 300 for insurance when going up and down with cursor. EDIT: adjusted lower bounds because of rounding errors that would cause freezing when not zooming in at 0,0
        const AR = graph.height/graph.width
        // const leftBoundsBefore = -zoom*(1+position[0]/(graph.width/2))
        // const bottomBoundsBefore = -zoom*AR*(1-position[1]/graph.height*2)

        // const initialPos = [leftBoundsBefore+(event.x/graph.width)*zoom*2,bottomBoundsBefore+(1-(event.y/graph.height))*zoom*2*AR]
        const origin = [graph.width/2+position[0],graph.height/2+position[1]]
        const mousePos = [event.x-origin[0],event.y-origin[1]]

        position = [mousePos[0]-mousePos[0]/scalar+position[0],mousePos[1]-mousePos[1]/scalar+position[1]] // dynamic zooming (this one line of code took so long to figure out idk why)
        lastPosition = position
        dragging = null
        // console.log(before*scalar-before)
        // position = [before*zoom*scalar,position[1]]
        // position = [-(event.x-graph.width/2)*(1+(event.deltaY/100*0.07)),(event.y-graph.height/2)*position[1]*(1+(event.deltaY/100*0.07))]
        // const offsetPos = [event.x-graph.width/2,event.y-graph.height/2]

        zoom *= scalar
    }
    updateGraph()
    // console.log(zoom)
    // console.log(event)
})

backtoorigin.addEventListener("click",()=>{
    position = [0,0]
    lastPosition = [0,0]
    zoom = 40
    updateGraph()
})

for(let i=1;i<=FUNC_COUNT;i++){
    document.getElementById("f"+i).addEventListener("input",()=>{
        updateGraph()
    });
}

switchtoderiv.addEventListener("click",()=>{
    graphingDiv.style.display = "none"
    derivativeDiv.style.display = "block"
    derivativeMode = true
})

switchtographing.addEventListener("click",()=>{
    derivativeDiv.style.display = "none"
    graphingDiv.style.display = "block"
    derivativeMode = false
})

df1.addEventListener("input",derivativeInputUpdate)

xslider.addEventListener("input",()=>{
    const precision = Math.pow(10,3)
    xinput.value = Math.round(xslider.value*precision)/precision
    calculateTanLine()
})

xinput.addEventListener("input",()=>{
    const precision = Math.pow(10,3)
    xslider.value = Math.round(xinput.value*precision)/precision
    calculateTanLine()
})

toggleui.addEventListener("click",()=>{
    uienabled = !uienabled
    toggleui.innerHTML = uienabled ? "Hide UI" : "Show UI"
    if(uienabled){
        graphingDiv.style.display = derivativeMode ? "none" : "block"
        derivativeDiv.style.display = derivativeMode ? "block" : "none"
    }else{
        graphingDiv.style.display = "none"
        derivativeDiv.style.display = "none"
    }
    vars.style.display = uienabled ? "grid" : "none"
    backtoorigin.style.display = uienabled ? "block" : "none"
})

document.getElementById("zoomin").addEventListener("click",()=>{
    zoom *= 1-ZOOM_RATE*2
})

document.getElementById("zoomout").addEventListener("click",()=>{
    zoom *= 1+ZOOM_RATE*2
})

// console.log(math.derivative("x^2/6+4/3/x/","x")._toString())

if(isMobile()){
    alert("This website is designed for use on a computer. It may not work as intended on your device.")
}

setInterval(updateGraph,100/3)

setInterval(()=>{
    let time = Math.floor(getTimeElapsed()*10)/10
    if(Number.isInteger(time)){
        time = time+".0"
    }
    t.value = time
})

setInterval(derivativeInputUpdate,500) // in case of weird bugs when using back button

derivativeInputUpdate()
calculateTanLine()
updateGraph()