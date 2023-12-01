

let isOn = localStorage.getItem('isOn') !== 'false';
let button;

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        const updated = localStorage.getItem('isOn') !== 'false';
        if (updated !== isOn) {
            isOn = updated;
            [...document.querySelectorAll(".x-hidden")].forEach((img) => {
                const listing = getContainer(img);
                hideListingIfOn(listing);
                showListingIfOff(listing);
            });
            updateButtonStyle(button);
        }
    }
});


function start() {  
    var images = [...document.querySelectorAll(SELECTOR)];
    images.forEach((img) => {
        var url = img.src || img?.dataset?.imageUrl;
        let weChangedOpacity = false;
        img.classList.add('x-handled');
        if (!url) {
            return;
        }
        if (!img.style.opacity) {
            img.style.opacity = 0.6;
            weChangedOpacity = true;
        }
        chrome.runtime.sendMessage(
            {message: "is_dlc_image", url: url}, 
            function(response) {
                const isDlcImage = response.data;
                const listing = getContainer(img);
                if (weChangedOpacity) {
                    img.style.opacity = 1;
                }
                if (isDlcImage) {
                    hideListingIfOn(listing);
                    listing.classList.add('x-hidden');
                    listing.setAttribute('data-is-dlc', 'true');
                } else {
                    listing.setAttribute('data-is-dlc', 'false');
                }
            }
        );    
    });
    addUnhideButton();
}

const hideListingIfOn = (listing) => {
    if (isOn) {
        if (listing.closest('#moredlcfrombasegame_block')) {
            return;
        }
        listing.style.display = 'none';
    }
}

const showListingIfOff = (listing) => {
    if (!isOn) {
        listing.style.display = 'block';
    }
}

const updateButtonStyle = (button) => {
    if (!button) {
        return;
    }
    if (isOn) {
        button.innerText = 'Include DLCs back';
        button.style.color = '#9fbbcb';
        button.style.borderColor = '#9fbbcb';
    } else {
        button.innerText = 'Hide all DLCs';
        button.style.color = 'indianred';
        button.style.borderColor = 'indianred';
    }
}

let debounce = -1;
const SELECTOR =[
    '.search_capsule img',
    '.tab_item img',
    '[class*="StoreSaleWidgetImage"] img',
    '.small_cap img',
    '.store_capsule img',
    'a[class*="weeklytopsellers"] img',
]
    .join(',')
    .replaceAll('img', 'img:not(.x-handled)');

const startWhenCssSelectorReturnsSomething = () => {
    const selector = document.querySelectorAll(SELECTOR);
    if (selector.length) {
        start();     
    }
    clearTimeout(debounce);
    debounce = setTimeout(startWhenCssSelectorReturnsSomething, 100);
}

const getContainer = (element) => {
    return element.closest('div[class*="SaleItemBrowserRow"]')
        || element.closest('tr')
        || element.closest('a')
}
        

const addUnhideButton = () => {
    let alreadyBtn = document.querySelector('.x-unhide-button');
    if (alreadyBtn) {
        return;
    }
    button = document.createElement('button');
    button.className = 'x-unhide-button';
    button.style.cssText = `
        position: relative;
        bottom: 0px;
        right: 0px;
        z-index: 999999999;
        padding: 10px;
        background: red;
        color: #9fbbcb;
        border: none;
        cursor: pointer;
        display: block;
        width: 100%;
        max-width: 300px;
        background: #1b2838;
        border: 1px solid #9fbbcb;
        margin-bottom: 10px;
        border-radius: 3px;
    `;

    updateButtonStyle(button);
    button.title = 'This button is added by the "Hide DLCs extension"'
    button.addEventListener('click', () => {
        const isHiding = button.innerText === 'Hide all DLCs';
        if (isHiding) {
            isOn = true;
        } else {
            isOn = false;
        }
        updateButtonStyle(button);
        localStorage.setItem('isOn', isOn.toString());
        [...document.querySelectorAll(".x-hidden")].forEach((img) => {
            const listing = getContainer(img);
            hideListingIfOn(listing);
            showListingIfOff(listing);
        });
    });
    var parent = document.querySelector('#additional_search_options')
    if (parent) {
        parent.prepend(button);
        return;
    }
    parent = document.querySelector('.tab_container > div > div') || document.querySelector('.home_tab_col');
    if (parent) {
        button.style.cssText += `
            background: none;
            margin-bottom: -32px;
            margin-top: 40px;
            margin-left: calc(100% - 180px);
            max-width: 180px;
        `;
        parent.prepend(button);
        return;
    }
    parent = document.querySelector('.SaleSectionCtn:has([class*="SaleItemBrowserRow"]) [class*="partnersaledisplay"]');
    if (parent) {
        button.style.cssText += `margin-left: auto; background: none;`;
        parent.prepend(button);
        return;
    }
}

debounce = setTimeout(() => startWhenCssSelectorReturnsSomething(), 0);
const observer = new MutationObserver(function(mutations) {
    var images = document.querySelectorAll(SELECTOR);
    if (images.length) {
        clearTimeout(debounce);
        setTimeout(start, 0);
        debounce = setTimeout(startWhenCssSelectorReturnsSomething, 500);
    }
});

addUnhideButton();
observer.observe(document.body, {childList: true, subtree: true});