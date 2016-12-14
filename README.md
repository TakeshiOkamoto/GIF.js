# GIF.js
Output images in JavaScript as GIF format. With color reduction function.

## How to use 

Japanese  
[test now](test  now)  

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

## Caution
If the HTML file is not uploaded to the server, it may not work depending on browser specifications.

HTML5 Web Worker makes it multi-threaded and faster.

## Contact
sorry, no warranty, no support. English Can understand only 3-year-old level.  

## Author
Copyright (c) 2016 Takeshi Okamoto

## Licence
MIT license.  
