export function get_configs(){
    return getCached('/configs')
}

export function get_config(waiver){
    return getCached(`/config/${waiver}`)
}

export function getBasePdf(url){
    return getCached(url, arrayBuffer)
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