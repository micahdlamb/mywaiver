export function get_configs(){
    return getCached('/get_configs')
}

export function get_config(waiver){
    return getCached(`/${waiver}/get_config`)
}

export function getBasePdf(url){
    return getCached(url, arrayBuffer)
}

export function submit_waiver(waiver, pdfBytes){
    const formData = new FormData()
    formData.set('pdf', new Blob([pdfBytes], {type: 'application/pdf'}))
    return fetch(`/${waiver}/submit`, {
        method: 'POST',
        body: formData
    }).then(resp => resp.json())
}

///////////////////////////////////////////////////////////////////////////////////////////////////

function get(url, as=json, cache=false){
    return fetch(url).then(as)
}
let json = resp => resp.json()
let arrayBuffer = resp => resp.arrayBuffer()

function getCached(url, as){
    if (!_cache[url])
        _cache[url] = get(url, as)
    return _cache[url]
}
const _cache = {}