var url = '';

const canvas = new OffscreenCanvas(1, 1);
const ctx = canvas.getContext('2d', {alpha: false, willReadFrequently: true});
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.message == "is_dlc_image") {
        (async () => {
            if (request.url.startsWith('data:') || request.url.startsWith('blob:') || !request.url.includes('.jpg')) {
                sendResponse({data: false});
                return;
            }
            let cache = await caches.open('booleans-images-are-dlc1');
            let base64Image = await cache.match(request.url);
            if (!base64Image) {
                // if not, fetch it:
                let response = await fetch(request.url);
                let file = await response.blob();
                let blackPxOffsetY = 10;
                // console.log('request.url', request.url)
                createImageBitmap(file).then((imageBitmap) => {
                    canvas.width = imageBitmap.width;
                    canvas.height = imageBitmap.height;
                    if (canvas.width > 184) {
                        let scale = 1;
                        scale = 184 / canvas.width;
                        canvas.width = 184;
                        canvas.height = canvas.height * scale;
                        ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
                        blackPxOffsetY = 15;
                        // debug only:
                        // canvas.convertToBlob().then((blob) => {
                        //     var reader  = new FileReader();
                        //     reader.onloadend = function () {
                        //         console.log(request.url, reader.result);
                        //     }
                        //     reader.readAsDataURL(blob);
                        // });
                    } else {
                        ctx.drawImage(imageBitmap, 0, 0);
                    }
                    url = request.url;
                    if (
                        checkPixelColor(ctx, 0, 13, 'PURPLE')
                        && checkPixelColor(ctx, 13, 0, 'PURPLE')
                        && (checkPixelColor(ctx, 4, blackPxOffsetY, 'BLACK')
                        || checkPixelColor(ctx, 5, 16, 'BLACK'))
                        ) {
                        sendResponse({data: true});
                        cache.put(request.url, new Response('true'));
                    }
                     else {
                        sendResponse({data: false});
                        cache.put(request.url, new Response('false'));
                    }
                });
            } else {
                base64Image.body.getReader().read().then(({done, value}) => {
                    const valueAsString = new TextDecoder("utf-8").decode(value);
                    // console.log("valueAsString", valueAsString);
                    sendResponse({data: valueAsString === 'true'});
                });
            }
        })();
        return true; // Required for async sendResponse()
      }
    }
  )

  
const checkPixelColor = (ctx, x, y, color) => {
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const [r, g, b] = [
        Math.round(pixel[0] / 32),
        Math.round(pixel[1] / 32),
        Math.round(pixel[2] / 32)
    ];
    // console.log(url, r, g, b);
    if (color === 'PURPLE') {
        return (r === 5 || r === 6) && (g === 3 || g === 2 ) && (b === 5 || b === 6);
    }
    if (color === 'BLACK') {
        return r < 2 && g === 0 && b < 2;
    }
    return false;
};