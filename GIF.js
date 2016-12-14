/**************************************************/
/*                                                */
/*     GIF.js                                     */
/*                                      v0.88     */
/*                                                */
/*     Copyright 2016 Takeshi Okamoto (Japan)     */
/*                                                */
/*     Released under the MIT license             */
/*     https://github.com/TakeshiOkamoto/         */
/*                                                */
/*                            Date: 2016-12-15    */
/**************************************************/

////////////////////////////////////////////////////////////////////////////////
// Generic function
////////////////////////////////////////////////////////////////////////////////

// 画像のカラー情報の取得
function getColorInfo(imagedata){
    var height = imagedata.height;
    var width  = imagedata.width;
    var raw    = imagedata.data;
    
    // 使用色/使用回数(面積)を取得
    var cnt = 0;
    var uses_colors = new Object;
    
    for(var i = 0; i< height;i++){
        for(var j = 0; j< width;j++){
            var key = raw[cnt]   + ',' + 
                      raw[cnt+1] + ',' + 
                      raw[cnt+2] ;
            if (!uses_colors[key]) 
                uses_colors[key] = 1;
            else  
               uses_colors[key] += 1;
              
            cnt = cnt + 4;
        }
    }

    // 連想配列を配列へ設定
    var rgb;
    var colors = new Array();   
    for (var key in uses_colors) {
       rgb = key.split(",");
       colors[colors.length] = {'r':parseInt(rgb[0],10),
                                'g':parseInt(rgb[1],10),
                                'b':parseInt(rgb[2],10),
                                'uses':uses_colors[key]}; // 使用数
    }
    return colors;
}

////////////////////////////////////////////////////////////////////////////////
// Generic Class
////////////////////////////////////////////////////////////////////////////////

// ---------------------
//  TFileStream            
// ---------------------
function TFileStream(BufferSize) {

    if (BufferSize == undefined)
        this.MemorySize = 5000000; // 5M
    else
        this.MemorySize = parseInt(BufferSize, 10);

    this.Size = 0;
    this.Stream = new Uint8Array(this.MemorySize);
}

// ---------------------
//  TFileStream.Method     
// ---------------------
TFileStream.prototype = {

    _AsciiToUint8Array: function (S) {
        var len = S.length;
        var P = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            P[i] = S[i].charCodeAt(0);
        }
        return P;
    },

    WriteByte: function (value) {
        var P = new Uint8Array(1);
        
        P[0] = value;
        
        this.WriteStream(P);      
    },
    
    WriteWord: function (value) {
        var P = new Uint8Array(2);
        
        P[1] = (value & 0xFF00) >> 8;
        P[0] = (value & 0x00FF);  
        
        this.WriteStream(P);      
    },

    WriteDWord: function (value) {
        var P = new Uint8Array(4);
        
        P[3] = (value & 0xFF000000) >> 24;
        P[2] = (value & 0x00FF0000) >> 16;
        P[1] = (value & 0x0000FF00) >> 8;
        P[0] = (value & 0x000000FF);  
        
        this.WriteStream(P);      
    },
    
    WriteWord_Big: function (value) {
        var P = new Uint8Array(2);
        
        P[1] = (value & 0x00FF);
        P[0] = (value & 0xFF00) >> 8;  
        
        this.WriteStream(P);      
    },        
    
    WriteDWord_Big: function (value) {
        var P = new Uint8Array(4);
        
        P[3] = (value & 0x000000FF) 
        P[2] = (value & 0x0000FF00) >> 8;
        P[1] = (value & 0x00FF0000) >> 16;
        P[0] = (value & 0xFF000000) >> 24;;  
        
        this.WriteStream(P);      
    },
        
    WriteString: function (S) {
        var P = this._AsciiToUint8Array(S);

        // メモリの再編成
        if (this.Stream.length <= (this.Size + P.length)) {
            var B = new Uint8Array(this.Stream);
            this.Stream = new Uint8Array(this.Size + P.length + this.MemorySize);
            this.Stream.set(B.subarray(0, B.length));
        }

        this.Stream.set(P, this.Size);
        this.Size = this.Size + P.length;
    },

    WriteStream: function (AStream) {      
        
        // メモリの再編成
        if (this.Stream.length <= (this.Size + AStream.length)) {
            var B = new Uint8Array(this.Stream);
            this.Stream = new Uint8Array(this.Size + AStream.length + this.MemorySize);
            this.Stream.set(B.subarray(0, B.length));
        }

        this.Stream.set(AStream, this.Size);
        this.Size = this.Size + AStream.length;
    },

    getFileSize: function () {
        return this.Size;
    },

    SaveToFile: function (FileName,type) {
        if (window.navigator.msSaveBlob) {
            window.navigator.msSaveBlob(new Blob([this.Stream.subarray(0, this.Size)], { type: type }), FileName);
        } else {
            var a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([this.Stream.subarray(0, this.Size)], { type: type }));
            //a.target   = '_blank';
            a.download = FileName;
            document.body.appendChild(a); //  FF specification
            a.click();
            document.body.removeChild(a); //  FF specification
        }
    },
}

// ---------------------
//  TMedianCut            
// ---------------------
// imagedata : 減色するImageDataオブジェクト
// colors    : getColorInfo()で取得したカラー情報 
function TMedianCut(imagedata,colors) {
  
  this.raw    = imagedata.data;
  this.width  = imagedata.width;
  this.height = imagedata.height;
  this.msg    = ''; 
  this.colors = colors;
}

// ---------------------
//  TMedianCut.Method     
// ---------------------
TMedianCut.prototype = {
   
  // プロパティの設定
  _setProperty : function (color){    
    var total =   0;
    var maxR  =   0, maxG =   0, maxB =  0;
    var minR  = 255, minG = 255, minB = 255;
    
    // 立方体の1辺の長さ
    for(var i = 0; i < color.length;i++){
      
      if (color[i].rgb.r > maxR) maxR = color[i].rgb.r ;
      if (color[i].rgb.g > maxG) maxG = color[i].rgb.g ;
      if (color[i].rgb.b > maxB) maxB = color[i].rgb.b ;
      
      if (color[i].rgb.r < minR) minR = color[i].rgb.r ;
      if (color[i].rgb.g < minG) minG = color[i].rgb.g ;
      if (color[i].rgb.b < minB) minB = color[i].rgb.b ;

      // キューブで使用している面積
      total += color[i].rgb.uses;
    }

    var dr  = (maxR - minR)*1.2;
    var dg  = (maxG - minG)*1.2; 
    var db  = (maxB - minB);
    
    // 同一の場合はrを優先する
    var colortype = 'r';
    
    // r 
    if (dr > dg && dr > db){
      colortype = 'r';
    }
    
    // g
    if (dg > dr && dg > db){
      colortype = 'g';
    }
    
    // b
    if (db > dr && db > dg){
      colortype = 'b';
    }    

    return { 'color' : color,    // キューブの各色情報
             'total' : total,    // キューブの総面積(総色数)
             'type'  : colortype,// キューブの種類(R/G/B)
             // キューブの体積用 'volume': dr * dg * db
             };
  },  
   
 // メディアンカット
  _MedianCut : function(cubes,colorsize){
    var count = 0;
    var index = 0;     
    
    // 面積(色数)が最大のキューブを選択
    for(var i = 0; i < cubes.length;i++){ 
      if(cubes[i].total > count){
        // 1点は除く
        if (cubes[i].color.length != 1){
          index = i;
          count = cubes[i].total;
        }
      }      
    }   
   
    // 体積が最大のキューブを選択
    //if(cubes[index].color.length == 1){      
    //  
    //  count =0;  index =0;
    //  
    // for(var i = 0; i < cubes.length;i++){ 
    //    if(cubes[i].volume > count){
    //      index = i;
    //      count = cubes[i].volume;
    //    }      
    //  }
    //}
    

    if (cubes[index].total == 1){
      // Cube could not be split.
      this.msg += colorsize + '色までキューブを分割できませんでした。\n';      
      return cubes;
    }
    
    if(cubes[index].color.length == 1){
      // Cube could not be split.
      this.msg += colorsize + '色までキューブを分割できませんでした。\n';
      return cubes;
    }    

    // メディアン由来の中央値を算出する
    var colortype = cubes[index].type;
    cubes[index].color.sort(function(a,b){
      if(a.rgb[colortype] < b.rgb[colortype] ) return -1;
      if(a.rgb[colortype] > b.rgb[colortype] ) return 1;
      return 0;
    });   
    split_border = Math.floor((cubes[index].color.length+1)/2);
    
    // 分割の開始       
    var split1 = new Array;
    var split2 = new Array;    
    for(var i = 0; i < cubes[index].color.length;i++){ 
      if (i < split_border){
        split1[split1.length] = cubes[index].color[i];
      }else{
        split2[split2.length] = cubes[index].color[i];
      }
    }   
    
    // プロパティの設定
    split1 = this._setProperty(split1);
    split2 = this._setProperty(split2);  
    
    // キューブ配列の再編成
    var result = new Array();
    for(var i = 0; i < cubes.length;i++){ 
      if (i != index){
        result[result.length] = cubes[i];
      }
    }
    result[result.length] = split1;
    result[result.length] = split2;
        
    if (result.length < colorsize){
      return this._MedianCut(result,colorsize);
    }else{
      return result;
    }
  },
  
  // 減色の実行
  // colorsize : 最大何色まで減色するかの色数(2- 256) 
  // update    : true ピクセルデータを更新 false 更新しない
  run : function(colorsize,update){    
   
    if (this.colors.length <= colorsize){
       // It has already been reduced color.
       this.msg = '既に'+ this.colors.length +'色に減色されています。\n';
       //return;
    }

    // 1個目のキューブの作成
    var plane = new Array;  
    for(var i = 0; i < this.colors.length;i++){ 
       plane[plane.length] = {'rgb': this.colors[i]};         
    }       

    var dummy = new Array();
    dummy[0] = this._setProperty(plane);
    
    // キューブの分割
    var cubes = this._MedianCut(dummy,colorsize);
     
    // キューブ毎に代表色(重み係数による平均)を算出する
    var rep_color = new Array();  
    for(var i = 0; i < cubes.length;i++){
      var count = 0;
      var r =0,g=0,b=0; 
      for(var j = 0; j < cubes[i].color.length;j++){ 
        r += cubes[i].color[j].rgb.r * cubes[i].color[j].rgb.uses; 
        g += cubes[i].color[j].rgb.g * cubes[i].color[j].rgb.uses; 
        b += cubes[i].color[j].rgb.b * cubes[i].color[j].rgb.uses; 
        count += cubes[i].color[j].rgb.uses;
      }
      rep_color[i] = {'r': Math.round(r/count),
                      'g': Math.round(g/count),
                      'b': Math.round(b/count)};    
    } 
    
    // 代表色の保存
    this.rep_color = rep_color;   
        
    // ピクセルデータの更新
    if (update) {

      // ピクセルデータ設定用の連想配列(高速化用)
      var pixels = new Object;
      for(var i = 0; i < cubes.length;i++){ 
        for(var j = 0; j < cubes[i].color.length;j++){ 
          pixels[cubes[i].color[j].rgb.r  + ',' + 
                 cubes[i].color[j].rgb.g  + ',' +
                 cubes[i].color[j].rgb.b] = {'r': rep_color[i].r,
                                             'g': rep_color[i].g,
                                             'b': rep_color[i].b}; 
        }
      }
          
      // データの設定                               
      var key,cnt =0;                               
      for(var i = 0; i< this.height;i++){
        for(var j = 0; j< this.width;j++){
          
          key = this.raw[cnt]   + ',' + 
                this.raw[cnt+1] + ',' + 
                this.raw[cnt+2];
          
          this.raw[cnt]   = pixels[key].r; 
          this.raw[cnt+1] = pixels[key].g; 
          this.raw[cnt+2] = pixels[key].b; 
           
          cnt = cnt + 4;
        }
      } 
    } 
  }  
}

// -----------------------
//  TGIFWriter            
// -----------------------
// imagedata : ImageDataオブジェクト 
function TGIFWriter(imagedata) {
  this.raw    = imagedata.data;
  this.width  = imagedata.width;
  this.height = imagedata.height;  
  
  this.MAX_DICTIONARY = 4096;  // 最大辞書数
  this.MAX_BLOCKSIZE  = 254;   // 最大イメージデータ数
  
  // カラーパレットの生成
  this._getColorPalette();
  
  if (this.palette.length > 256){
    throw 'Please reduce the number of colors of the image to 256 colors or less.';
  }  
}

// -----------------------
//  TGIFWriter.Method     
// -----------------------
TGIFWriter.prototype = {    

    // 画像からパレットの生成
    _getColorPalette: function () {
        var height = this.height;
        var width  = this.width;
        var raw    = this.raw;
        
        // 使用色を取得
        var cnt = 0;
        var uses_colors = new Object;
        
        for(var i = 0; i< height;i++){
            for(var j = 0; j< width;j++){
                var key = raw[cnt]   + ',' + 
                          raw[cnt+1] + ',' + 
                          raw[cnt+2] ;
                    uses_colors[key] = 1;        
                cnt = cnt + 4;
            }
        }

        // 配列の設定
        var rgb,cnt = 0;
        var palette = new Array();   
        for (var key in uses_colors) {
            rgb = key.split(",");
            
            // 連想配列を配列へ変換
            palette[cnt] = {'r':parseInt(rgb[0],10),
                            'g':parseInt(rgb[1],10),
                            'b':parseInt(rgb[2],10)};
                                     
            // 連想配列へカラー番号を設定(高速化用)                         
            uses_colors[key] = cnt;
                
            cnt++;                     
        }
        
        this.palette = palette;
        this.uses_colors = uses_colors;        
    },
    
    // GIFヘッダー用のビット処理
    _Octet_Header: function (gctf,cr,sf,sgct) {
        var result = 0;
        
        // [1Bit]共通パレット
        // 存在する:1 存在しない:0
        result |=  gctf << 7;
         
        // [3Bit]1画素のビット数値:0-7
        // ※この値は重要ではない 常に0(000)や7(111)の場合がある
        result |=  cr << 4;
        
        // [1Bit]共通パレットのソートフラグ  
        // ソート済み:1 未ソート:0  
        result |=  sf << 3;        
        
        // [3Bit]共通パレットの色数(0-7) 
        result |=  sgct;    
        
        return result;         
    },
    
    // Image Dataヘッダー用のビット処理
    _Octet_ImageData: function (lctf,ifl,sf,r,slct) {
        var result = 0;
        
        // [1Bit]固有パレット
        // 存在する:1 存在しない:0
        result |=  lctf << 7;
         
        // [1Bit]インタレース
        // なし:0 あり:1
        result |=  ifl << 6;
        
        // [1Bit]共通パレットのソートフラグ 
        // ソート済み:1 未ソート:0  
        result |=  sf << 5;        
        
        // [2Bit]未使用 
        result |=  r << 3;    
        
        // [3Bit]固有パレットの色数(0-7)
        result |=  slct;    
        
        return result;         
    },         
     
    // LZW圧縮 
    _CompressLZW: function (pByteArray,bits,bits_length) {      
      var dictionary; // 辞書配列
      var next_pos;   // 次の辞書番号
      var CLEAR_CODE; // クリアコード 
      var END_CODE;   // 終了コード
      
          // 辞書の初期化
          function init_dictionary(){
             
              // (例) 2bit(0,1,2,3)の初期化のイメージ      
              //dictionary[char(0)] = 0;
              //dictionary[char(1)] = 1;
              //dictionary[char(2)] = 2;
              //dictionary[char(3)] = 3;                            
              //dictionary[char(4)] = 4; // クリアコード
              //dictionary[char(5)] = 5; // 終了コード
              //next_pos = 6;
              
              // 辞書の生成
              dictionary  = new Object; 
              
              // 辞書の初期化
              var count =  Math.pow(2,bits);
              
              for(var i=0;i< count;i++){
                 dictionary[String.fromCharCode(i)] = i;
              }
              
              // クリアコード/終了コードの設定 
              dictionary[String.fromCharCode(count)]   = CLEAR_CODE = count ;
              dictionary[String.fromCharCode(count+1)] = END_CODE   = count+1;
              
              // 次の辞書番号 
              next_pos = count + 2;         
          }
          
          // ビット長の取得(3bitから12bit)
          function getBitsLength(index){
              var result;

              if (index>=0 && index<=7){
                  result =  3;          
              }else if (index>=8 && index<=15){
                  result = 4;  
              }else if (index>=16 && index<=31){
                  result = 5;                       
              }else if (index>=32 && index<=63){
                  result = 6;                       
              }else if (index>=64 && index<=127){
                  result = 7; 
              }else if (index>=128 && index<=255){
                  result = 8;
              }else if (index>=256 && index<=511){
                  result = 9; 
              }else if (index>=512 && index<=1023){
                  result = 10;   
              }else if (index>=1024 && index<=2047){
                  result = 11;                                                              
              }else if (index>=2048 && index<=4095){
                  result = 12;                 
              }else{
                  throw('The dictionary is from 3 bits to 12 bits.');
              }   
              
              return result;
          }      
      
      var stream = new Array();     
      var len = pByteArray.length;
      
      // バイト配列をASCIIコードの文字列へ変換
      var s = '';
      for(var i=0;i<len;i++){
         s += String.fromCharCode(pByteArray[i]);
      }
      
      // 辞書の初期化 
      init_dictionary();
          
      var prefix;    // 現在のシーケンス(Current Sequence)
      var suffix;    // 次の文字(Next Char)  
      var com1,com2; // 連結文字列
      var count = 0;
      var endflg = false;
      
      // ----------------------------
      //  1回目
      // ----------------------------
      prefix = s[0];
      if (s.length != 1){
          suffix = s[1];
      }else{
          suffix = '';
      }
     
      // 文字列を辞書に登録           
      dictionary[prefix + suffix] = next_pos;
      
      // --- ココは本来必須ではないが出力しないと読み込めないアプリがある
      
        // クリアコードの出力
        stream[stream.length] = CLEAR_CODE;            
       
        // ビット長の格納      
        bits_length[bits_length.length] = getBitsLength(next_pos-1);
      
      // --- 
                   
      // 辞書番号の出力
      stream[stream.length] = dictionary[prefix];
             
      // ビット長の格納      
      bits_length[bits_length.length] = getBitsLength(next_pos-1);
           
      // 次の辞書番号
      next_pos++;
                            
      // 次の文字を対象とする
      prefix = suffix;
      
      count++;
            
      // ----------------------------
      //  2回目以降
      // ----------------------------            
      while (true){
        
        // 終端
        if ((count+1) >= (len)){
          
          if (s.length == 1) break;
            
          stream[stream.length] = dictionary[s[count]];
          bits_length[bits_length.length] = getBitsLength(next_pos);
          break;
        }         

        suffix = s[++count];
        com1 = prefix + suffix;
       
        // 辞書にある場合 
        if (dictionary[com1]){
         
          while (true){
              
              // 終端
              if ((count+1) == (len)){                
                            
                // 現在の連結文字列の辞書番号を出力
                stream[stream.length] = dictionary[com1];
                
                // ビット長の格納      
                bits_length[bits_length.length] = getBitsLength(next_pos);
                            
                endflg = true;
                break;
              }   
              
              // 連結文字に次の文字を連結
              com2 = com1 + s[++count];                  
              
              // 辞書にある場合
              if (dictionary[com2]){
                com1 = com2;
                continue;
             
              // 辞書にない場合 
              }else{
                
                // 現在の連結文字列を辞書に登録           
                dictionary[com2] = next_pos;
                
                // 1つ前の連結文字の辞書番号の出力
                stream[stream.length] = dictionary[com1];
                
                // ビット長の格納      
                bits_length[bits_length.length] = getBitsLength(next_pos-1);
                
                // 次の辞書番号
                next_pos++;             
                
                // 辞書数のチェック
                if (next_pos > this.MAX_DICTIONARY){ 
                  // クリアコードの出力
                  stream[stream.length] = CLEAR_CODE;            
                 
                  // ビット長の格納      
                  bits_length[bits_length.length] = getBitsLength(next_pos-2); 
                  
                  // 辞書の初期化                     
                  init_dictionary();
                }
                                        
                prefix = s[count];
                break;
              }                  
           }
      
           if(endflg) break;               
         
         // 辞書にない場合 
         }else{
            // 文字列を辞書に登録           
            dictionary[com1] = next_pos;

            // 辞書番号の出力
            stream[stream.length] = dictionary[prefix];
          
            // ビット長の格納      
            bits_length[bits_length.length] = getBitsLength(next_pos-1);

            // 次の辞書番号
            next_pos++;
                         
            // 辞書数のチェック
            if (next_pos > this.MAX_DICTIONARY){ 
              // クリアコードの出力
              stream[stream.length] = CLEAR_CODE;            
             
              // ビット長の格納      
              bits_length[bits_length.length] = getBitsLength(next_pos-2); 
              
              // 辞書の初期化                         
              init_dictionary();
            }   
                                                                        
            // 次の文字を対象とする
            prefix = suffix;            
          }          
      }
      
      // 終了コード
      stream[stream.length] = END_CODE;
      // ビット長の格納      
      bits_length[bits_length.length] = getBitsLength(next_pos);
        
      return stream; 
    },
        
    SaveToStream: function (r,g,b) {
        var F = new TFileStream();
        
        // ----------------------------
        //  GIF Header(13byte)
        // ----------------------------
                
        // シグネチャ(署名)
        F.WriteByte(0x47); // G
        F.WriteByte(0x49); // I
        F.WriteByte(0x46); // F
        
        // バージョン(GIF89a)
        F.WriteByte(0x38);
        F.WriteByte(0x39);
        F.WriteByte(0x61);
        
        // 画像の横幅
        F.WriteWord(this.width);
        
        // 画像の縦幅
        F.WriteWord(this.height);
        
        // 共通パレットや画素数など
        var cr,sgct;
        var len = this.palette.length;
        if (len >= 1 && len <=2){          cr = sgct = 0;}
        else if (len >= 3   && len <=4)  { cr = sgct = 1;}
        else if (len >= 5   && len <=8)  { cr = sgct = 2;}
        else if (len >= 9   && len <=16) { cr = sgct = 3;}
        else if (len >= 17  && len <=32) { cr = sgct = 4;}
        else if (len >= 33  && len <=64) { cr = sgct = 5;}
        else if (len >= 65  && len <=128){ cr = sgct = 6;}
        else if (len >= 129 && len <=256){ cr = sgct = 7;}
        
        F.WriteByte(this._Octet_Header(1,cr,0,sgct)); 
        
        // 背景色のパレットインデックス
        F.WriteByte(0);
        
        // 縦横比
        F.WriteByte(0);
        
        // ----------------------------
        //  共有パレット
        // ----------------------------
                
        // パレット
        for(var i=0; i<len;i++){
            F.WriteByte(this.palette[i].r);
            F.WriteByte(this.palette[i].g);
            F.WriteByte(this.palette[i].b);          
        }       
        
        // 不足分のパレット
        var max_len = Math.pow(2,(cr+1));
        for(var i=len; i<max_len;i++){
            F.WriteByte(0x00);
            F.WriteByte(0x00);
            F.WriteByte(0x00);
        }        
        
        // ----------------------------
        //  透過(省略可能)
        // ----------------------------
        
        // Graphic Control Extension
        if (typeof r !== "undefined" && 
            typeof g !== "undefined" &&
            typeof b !== "undefined") {
          
          // 固定値
          F.WriteByte(0x21);
          F.WriteByte(0xF9); 
          
          // ブロックサイズ
          F.WriteByte(4); 
          
          // アニメ設定(未使用)
          F.WriteByte(1); 
          
          // アニメの待ち時間(未使用)
          F.WriteWord(0); 

          // 透過色のパレットインデックス
          var palflg = false;
          for(var i=0; i<len;i++){
            if (r == this.palette[i].r &&
                g == this.palette[i].g &&
                b == this.palette[i].b ){
              F.WriteByte(i); 
              palflg = true;
              break;
            }
          } 
          
          if(!palflg) throw('The color specified as transparent color is not on the palette.');
          
          // ブロックの終端
          F.WriteByte(0); 
        }
                
        // ----------------------------
        //  Image Data Header(11byte)
        // ----------------------------
        
        // 固定値
        F.WriteByte(0x2C);
        
        // 画像の左位置
        F.WriteWord(0);
        
        // 画像の上位置
        F.WriteWord(0);

        // 画像の横幅
        F.WriteWord(this.width);
        
        // 画像の縦幅
        F.WriteWord(this.height);
        
        // 固有パレットやインタレースなど
        F.WriteByte(this._Octet_ImageData(0,0,0,0,0));        
        
        // 固有パレット
        // none
        
        // LZW圧縮の最小ビット数(2-8)
        var lzw_minimum_code = cr +1;
        if (lzw_minimum_code == 1){
            lzw_minimum_code = lzw_minimum_code +1;
        }
        F.WriteByte(lzw_minimum_code);  
        
        // ----------------------------
        //  イメージをパレット番号へ
        // ----------------------------
        var index = 0;    
        var raw = this.raw;
        var len = this.width * this.height;            
        var pByteArray = new Uint8Array(len);

        for(var i=0; i<len;i++){
            pByteArray[index++] = this.uses_colors[raw[(i*4)]   + ',' +
                                                   raw[(i*4)+1] + ',' +
                                                   raw[(i*4)+2]];
        }           

        // ----------------------------
        //  LZW圧縮
        // ----------------------------
        var bits_length = new Array(); // 配列毎のビット長
        var lzw = this._CompressLZW(pByteArray,lzw_minimum_code,bits_length);
       
        // ----------------------------
        //  圧縮データのビット数を取得
        // ----------------------------
        var max_bits_size = 0;
        for(var i=0;i<bits_length.length;i++){          
            max_bits_size += bits_length[i];     
        }
                
        // ----------------------------
        //  圧縮データをbitに変換(右詰)
        // ----------------------------    
        var index = 0;
        var bits = new Uint8Array(max_bits_size);
        for(var i=0;i<lzw.length;i++){
            var b = lzw[i];
            for(var j=0;j<bits_length[i];j++){
              if (j==0){
                bits[index++] = (b & 1);
              }else{
                bits[index++] = (b & (1 << j)) >> j;
              }
            }          
        }
                
        // ----------------------------
        //  bit配列をbyte単位に変換
        // ----------------------------     
              
        // 端数処理
        var stream; 
        if (max_bits_size % 8 == 0){
            stream = new Uint8Array(max_bits_size / 8);
        }else{
            stream = new Uint8Array(Math.floor(max_bits_size / 8)+1);
        }

        var count = 0;
        var index = 0;
        var bitcount = 0;
        var onebyte  = 0;
        while (true){
          
          onebyte |=  bits[count++] << bitcount;
          if (count == max_bits_size){
              stream[index++] = onebyte;
              break;
          }          
          bitcount++;
          
          // 次のバイト
          if (bitcount == 8){           
             stream[index++] = onebyte;
             bitcount = 0;            
             onebyte =0;
          }           
        }
                
        // ----------------------------
        //  データの書き込み
        // ----------------------------             
        var len = stream.length;
        var blocks;    // ブロック数
        var remainder; // 余りのバイト数
        
        // 端数処理
        if (len % this.MAX_BLOCKSIZE == 0){
           blocks    = len / this.MAX_BLOCKSIZE;
           remainder = 0;
        }else{
           blocks = Math.floor(len / this.MAX_BLOCKSIZE);
           remainder = len % this.MAX_BLOCKSIZE;
        }
        
        var count = 0;
        while (true){            
            if ((count+1) <= blocks){
              
                // Block Size 
                F.WriteByte(this.MAX_BLOCKSIZE);
                
                // Image Data 
                var s = count * this.MAX_BLOCKSIZE;
                var e = (count * this.MAX_BLOCKSIZE) + this.MAX_BLOCKSIZE;
                for(var i=s; i<e; i++){
                    F.WriteByte(stream[i]); 
                }
                count++;
            }else{

              // 端数なし
              if (remainder == 0) break;

              // Block Size 
              F.WriteByte(remainder);
                
              // Image Data 
              var s = count * this.MAX_BLOCKSIZE;
              var e = (count * this.MAX_BLOCKSIZE) + remainder;
              for(var i=s; i<e; i++){
                 F.WriteByte(stream[i]); 
              }   
              break;           
            }            
        }
         
        // -----------------------
        //  Block Terminator
        // -----------------------
        F.WriteByte(0);                
               
        // -----------------------
        //  Trailer
        // -----------------------
        F.WriteByte(0x3B);        
                        
        return F;      
    },           
    
    // GIFファイルの生成     
    // FileName : ファイル名
    // r,g,b    : 透明色(省略可能)     
    SaveToFile: function (FileName,r,g,b) {
      var F = this.SaveToStream(r,g,b);
    
      // ファイルをダウンロード             
      F.SaveToFile(FileName,"image/gif");   
    }     
}  
