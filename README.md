Tile Based WebGL Deferred Shader
----------------------------------------
[Yuqin](https://github.com/yuqinshao) & [Sijie](https://github.com/tiansijie)
-------------------------------------------------------------------------------

Overview
--------------------------------------------
Deferred shading, a screen-space shading technique, which enables fast and complex light resource management, has been more and more widely used in game industry. However, it seems this technique has much less use on WebGL.
In this project, we are trying to implement an advanced deferred shader on WebGL as well as to achieve some non-photorealistic rendering effects. Besides, in order to accelerate the whole process, we plan to implement the tile based deferred shading. Having these features, we can make games like Borderland on Web.


Note
-------------------------------------------
Make sure your browser's setting is correct in order to run this project.

Check the below link.

https://github.com/mrdoob/three.js/wiki/How-to-run-things-locally 

The easiest way is to use the firefox.
* Go to about:config
* Find security.fileuri.strict_origin_policy parameter
* Set it to false


Details
---------------------------------------------------------------
* We use webgl [WEBGL_depth_texture](http://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/) exension, and here is a very good [example](http://blog.tojicode.com/2012/07/using-webgldepthtexture.html) to show how to use this extension 
* We also use [OES_texture_float](http://www.khronos.org/registry/webgl/extensions/OES_texture_float/) which suports floating type texture in WebGL.

References
---------------------------------------------------------------
* [A demo of webgl deferred shading](http://codeflow.org/entries/2012/aug/25/webgl-deferred-irradiance-volumes/#!)
* [Tile based deferred shading](http://bps10.idav.ucdavis.edu/talks/12-lauritzen_DeferredShading_BPS_SIGGRAPH2010_Notes.pdf) 


Third Party
-------------------------------------------------



