const {skaler} = require('./skaler/skaler.js');

/**
 * 
 * @param {input file event} event 
 * @param {String} previewImg (optional ID or Class of item where to place a preview of the rendered image) 
 */
const processFile = function (event, previewImg) {
    try{
        if(event.target.files.length > 0){
            let preview = document.getElementById(previewImg) || document.getElementsByClassName(previewImg);
            
            const imagen = event.target.files[0];
            
            let reader = new FileReader();
            
            if(previewImg !== ''){
                reader.onload = (event) => {
                    preview.src = event.target.result;
                }
            }
            
            reader.readAsDataURL(imagen);
            
            return imagen;
        }
    } catch(error){
        console.error(error);
    }
}


const editImg = async function(file = null, opts = '') {
    try{
        if(file !== null){
            return new Promise(async resolve => {
                if(opts !== ''){
                    const img = await skaler(file, opts);
                    resolve({img});
                } else{
                    const img = file;
                    resolve({img})
                }
            });
        } else{
            console.error('You must insert an image')
        }
    } catch(error) {
        console.error(error);
    }
}

/**
 * 
 * @param {*} image processed image (use processFile function for that)
 * @param {*} api {url, key, preset} 
 */

const saveImage = async function(image = null, api = {}){ 
    return new Promise(async (resolve, reject) => {
        try{
            if(api.url !== undefined && api.key !== undefined && api.preset !== undefined && api.image !== null){
                // Creating payload
                let formData = new FormData();
                formData.append("file", image);
                formData.append("api_key", api.key);
                formData.append("upload_preset", api.preset);
                
                // Upload image
                try{
                    await fetch(api.url, { method: "POST", body: formData })
                    .then(response => response.json()) //convertimos la respuesta en json
                    .then(data => {
                        resolve({publicId: data.public_id, url: data.url, secure_url: data.secure_url})
                    })
                    .catch(error => reject({error}));
                } catch(error){
                    reject(error)
                }
                    
            } else{
                reject('The function "saveImage" need a processed image (use processFile function for that) and an object param that contain {url, key, preset}')
            }
        } catch(error){
            reject(error);
        }
    });
}

/**
 * 
 * @param {*} image processed image (use processFile function for that)
 * @param {*} api {url, key, preset} 
 * @param {*} uploading (OPTIONAL State object that contain uploadProgress for the upload bar)
 */

const saveMultipleImages = async function(image = null, api = {}, uploading = (state, progress) => {}){
    return new Promise(async (resolve, reject) => {
        try{
            if(api.url !== undefined && api.key !== undefined && api.preset !== undefined && api.image !== null){
                
                if(uploading !== null){
                    uploading(true, 0);
                }
                
                const images = await Promise.all([
                    editImg(image, {width: 50}),
                    editImg(image, {width: 320}),
                    editImg(image, {width: 720}),
                    editImg(image),
                ]);
                
                let imagesURL = [];
                let count = 1;
                
                for (const {img} of images){
                    let saved = false;
                    
                    await saveImage(img, {url: api.url, key: api.key, preset: api.preset}).then(res=>{
                        saved = true;
                        imagesURL.push(res);
                        
                        uploading(true, parseInt(count / images.length * 100));
                    }).catch(e=>{
                        imagesURL = [];
                        
                        reject('Ocurrió un error subiendo las imágenes');
                    });
                    
                    if(!saved){
                        uploading(false, parseInt(count / images.length * 100));
                        return 0;
                    }
                    
                    count++;
                }
                
                if(imagesURL.length){
                    if(uploading !== null){
                        uploading('done', 100);
                    }
                    
                    resolve(imagesURL);
                }

            } else{
                reject('The function "saveMultipleImage" need a processed image (use processFile function for that) and an object param that contain {url, key, preset}');
            }
        } catch(error){
            reject(error)
        }
    });
}

module.exports = {processFile, editImg, saveImage, saveMultipleImages};