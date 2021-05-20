(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.resizeandsave = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const {skaler} = require('./skaler/skaler.js');

/**
 * 
 * @param {input file event, File Object, Data64/String route image} event 
 * @param {String} previewImg (optional ID or Class of item where to place a preview of the rendered image) 
 */
const processFile = async function (event, previewImg) {
    try{
        let image = event;

        // Validating if the image is a data64 or image route
        // Then, if it is, convert it to File Object
        if(typeof image == "string"){
            let filename = (image.match(/(\w+)(\.\w+\.\w+)/) || ["", "newImage"])[1];
            let mimeType = "image/png";

            await srcToFile(image, filename, mimeType).then(file=>{
                image = file;
            });
        }

        if(isAInputFileEventOrFileObject(image)){
            let preview = document.getElementById(previewImg) || document.getElementsByClassName(previewImg);
            
            const imagen = typeof image.target == "undefined"? image:image.target.files[0];
            
            let reader = new FileReader();
            
            if(previewImg !== ''){
                reader.onload = (image) => {
                    preview.src = image.target.result;
                }
            }
            
            reader.readAsDataURL(imagen);
            
            return imagen;
        } else{
            throw('The image must be an Input File event or a File Object, data64 image or some image path.')
        }
    } catch(error){
        console.error(error);
    }
}

const isAInputFileEventOrFileObject = function (event) {
    return (typeof event.target !== "undefined" && event.target.files.length > 0) || 
            (typeof event.type !== "undefined" && event.type.match(/image\//) !== null)
}

const srcToFile = async (src, fileName, mimeType) => {
    return await (fetch(src)
        .then((res)=>{return res.arrayBuffer();})
        .then((buf)=>{return new File([buf], fileName, {type:mimeType});})
    );
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
},{"./skaler/skaler.js":2}],2:[function(require,module,exports){
const skaler = function (file, { scale, width, height, name = file.name, type = file.type } = {}) {
	return new Promise((res, rej) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = e => {
			const img = new Image();
			img.onload = () => {
				const el = document.createElement('canvas');
				const dir = (width < img.width || height < img.height) ? 'min' : 'max';
				const stretch = width && height;
				const ratio = scale ? scale : Math[dir](
					(width / img.width) || 1,
					(height / img.height) || 1
				);
				let w = el.width = stretch ? width : img.width * ratio;
				let h = el.height = stretch ? height : img.height * ratio;
				const ctx = el.getContext('2d');
				ctx.drawImage(img, 0, 0, w, h);
				el.toBlob(blob => res(new File([blob], name, { type, lastModified: Date.now() })));
				reader.onerror = rej;
			}
			img.src = e.target.result;      
		}
	});
}

module.exports = {skaler};
},{}]},{},[1])(1)
});
