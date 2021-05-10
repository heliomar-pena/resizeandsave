# resizeandsave

This library proposes a solution to upload images in different qualities from a single image, through an endpoint. *(It was created with a purpose and may contain things that are not useful to you. Feel free to modify it to meet your requirements)*

## Dependencies

This library works thanks to the Skaler library by Terkel Gjervig.

## Examples of results (in Cloudinary)

![image](https://user-images.githubusercontent.com/66505715/117478972-c9dc9e00-af2d-11eb-87aa-40d6b2328f65.png)

# Installation

Clone the repository for editing or download the file to the dist folder and paste it into your project. If you don't know how, you can be guided by these little guides:

## For React

In the case of React you will need to save the index.js files together with the skaler folder in your project, remember that they must be together (resizeandsave.js and the skaler folder).

Then you can include it by doing an import or a require to the resizeandsave.js file. Examples will be added later

## For Vue

In the case of Vue you will only need the file that is inside the dist folder, you can save it in your project and use an import or a require.

> In either case you will not need to import Skaler into your project. In case of React you will only need Skaler to be in the same folder as index.js, and in case of React you will not need to bring skaler to your project, since the compiled dist file will bring it with it

**Example:**

```javascript
import resizeandsave from '@/assets/resizeandsave.js'
```

# How to use

```javascript
processFile(param1, param2)
```

It helps to read the event that has been activated by the user through an input type file, returning the "processed" image and placing a preview (optional) of the image in the object that has the ID or class passed in the parameter two

**param1** = input file change event.      
**param2** = name of the ID or Class (unique) of an img tag where you want the image that opened in the input file to be displayed.

**Returns**: The image object obtained from event.target.files [0]

**Example:**

HTML:

```HTML
<img id="imgPreview">
<input type="file" onChange="processFile($event)" />
```

Script:
```javascript
const processFile = (event) => {
    image = resizeandsave.processFile(event, "imgPreview");
 }
```


**Result:**

![image](https://user-images.githubusercontent.com/66505715/117488352-4bd2c400-af3a-11eb-84ab-0f394a1595b3.png)



```javascript
saveSingleImage(param1, param2)
```

Upload an original size image to the endpoint that you send as a parameter

**param1** = The image returned from the processFile function or the File object stored in event.target.file [0]      
**param2** = An object with the data from the cloudinary api. With this data: {url: '', key: '', preset: ''}

**Returns**: A promise containing the URL and publicId of the uploaded image.

**Example:**

```HTML
<button onClick="saveSingleImage()">Upload original image</button>
```

Script:
```javascript
const saveSingleImage = async (image, api) =>{
      await resizeandsave.saveImage(image, api).then(res => {
        // We save the links returned in the promise
        uploaded = uploaded.concat(res);
      }).catch(e => {
        console.log(e);
      });
    }
```



```javascript
saveMultipleImages(param1, param2, function()) 
```

Upload the original image and 3 smaller images to Cloudinary.

**param1** = The image returned from the processFile function or the File object stored in event.target.file [0]      
**param2** = An object with the data from the cloudinary api. With this data: {url: '', key: '', preset: ''}      
**function()** = An optional function that will allow you to obtain the upload process of those 4 images. This must receive two parameters: `(state, num)`, which will be the State of the load: (false, true, 'done') and the percentage of this. With this data in your function you could use it to create a loading bar.

**Returns**: A promise that contains the URL and publicId of all image qualities. In order: 50w, 320w, 720w, original size.

**Example:**

HTML
```HTML
    <form onSubmit="saveMultipleImages()" method="post">
        <button type="submit">Upload image in various qualities</button>
    </form>
```

```javascript
     const saveMultipleImages = async () => {
      // We create an event that modifies the variables that move our loading bar
      // And receive as parameters the status and the percentage
      const uploading = (state, num) => {
        uploadingBar.state = state;
        uploadingBar.uploadProgress = num;
      }

      await resizeandsave.saveMultipleImages(imagen, api, uploading)
        .then(res => {
          // We save the links returned in the promise
          uploaded = uploaded.concat(res);
        }).catch(e => {
          console.log(e)
        })
    }
```
