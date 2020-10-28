export function get_config(){
    return get('/config')
}

export function getBasePdf(){
    return fetch('/waiver.pdf').then(resp => resp.arrayBuffer())
}

///////////////////////////////////////////////////////////////////////////////////////////////////

function get(url){
    return fetchJson('GET', url)
}

// function post(url, body){
//     return fetchJson('POST', url, body)
// }

// function put(url, body){
//     return fetchJson('PUT', url, body)
// }

// function del(url){
//     return fetchJson('DELETE', url)
// }

function fetchJson(method, url, body){
    return fetch(url, {
        method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: body && JSON.stringify(body)
    }).then(response => {
        if (!response.ok)
            throw Error(response.statusText)
        return response.json()
    }).catch(error => {
        window.enqueueSnackbar(error.message, {variant: 'error'})
    })
}