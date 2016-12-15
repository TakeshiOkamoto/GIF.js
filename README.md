# GIF.js
Output images in JavaScript as GIF format. with color reduction function.  

## Support format  
2/4/8/16/32/64/128/256 color (support transparent)  
If there are more colors than 256 colors, TMedianCut is reduce the color.

## How to use 

Japanese  
[http://www.petitmonte.com/javascript/howto_gif_js.html](http://www.petitmonte.com/javascript/howto_gif_js.html)  

English

```rb
// Obtain color information of image
var colors = getColorInfo(imagedata);

// Reduce the color to 256 colors 
// when the number of colors of the image is larger than 256 colors
if(colors.length > 256){
  var MedianCut = new TMedianCut(imagedata,colors);
  MedianCut.run(256,true);
} 
  
// *** Constructor   
// First argument : ImageData object  
var GIFWriter = new TGIFWriter(imagedata);

// *** Method  
// First  argument : file name
// Second argument : (Optional)Transparent color(Red)   0-255
// Third  argument : (Optional)Transparent color(Green) 0-255
// Fourth argument : (Optional)Transparent color(Blue)  0-255
GIFWriter.SaveToFile('untitle.gif',r,g,b);

```

TMedianCut details  
[https://github.com/TakeshiOkamoto/MedianCut.js](https://github.com/TakeshiOkamoto/MedianCut.js) 

## Caution
If the HTML file is not uploaded to the server, it may not work depending on browser specifications.

HTML5 Web Worker makes it multi-threaded and faster.

## Contact
sorry, no warranty, no support. English Can understand only 3-year-old level.  

## Author
Copyright (c) 2016 Takeshi Okamoto

## Licence
MIT license.  
