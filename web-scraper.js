const http = require('http')
const url = require('url')
const puppeteer = require('puppeteer')

const server = http.createServer(async (req, res) => {

    const scrap_url = url.parse(req.url, true).query.url || null
    let productData;

    if (scrap_url) {

        res.setHeader('Content-Type', 'application/json')

        const page = await loadWebPage(scrap_url);

        productData = await page.evaluate(()=>{

            function getPrice() {

                const possiblePrices = [
                    document.getElementById("priceblock_dealprice"),
                    document.getElementById("priceblock_ourprice"),
                    document.getElementById("priceblock_saleprice"),
                    document.querySelector('[data-a-color="price"]')
                ]

                for (let i = 0; i < possiblePrices.length; i++) {

                    if (possiblePrices[i] != null) {
    
                        let price = possiblePrices[i].innerText
            
                        if (price.includes('-')) {
                            return "Specs not defined."
                        }
                
                        else if (price.includes('$')) {
                            return parseFloat(price.replace(/[US$ ,]/g, ''))
                        }
                
                        else {
                            return "Wrong currency, please switch to US$."
                        }
    
                    }
    
                    else if (i == possiblePrices.length - 1 && possiblePrices[i] == null) {
                        return "Price not found."
                    }
    
                }
            }

            function getSize() {
                const possibleSizes = [
                    document.getElementById("native_dropdown_selected_size_name"), 
                    document.querySelector("#variation_size_name .a-row .selection")
                ]

                for (let i = 0; i < possibleSizes.length; i++) {
                    let size = possibleSizes[i]

                    if (size && i == 0) {
                        return size.options[size.selectedIndex].innerText
                    }

                    else if (size && i == 1) {
                        return size.innerText
                    } 
                    
                    else {
                        return "Size not found."
                    }
                }
            }

            const product = {}

            product['title'] = document.getElementById("productTitle").innerText
            product['imageSrc'] = document.querySelector(".imgTagWrapper img").src
            product['price'] = getPrice()
            product['color'] = document.querySelector("#variation_color_name .a-row .selection").innerText || "Color not found."
            product['size'] = getSize()
            product['style'] = document.querySelector("#variation_style_name .a-row .selection").innerText || "Style not found."

            return product
        })

    }

    res.end(JSON.stringify(productData))

})

async function loadWebPage(url) {
    const browser = await puppeteer.launch({
        args:[
            '--no-sandbox',
        ]
    })
    const context = await browser.createIncognitoBrowserContext()
    const page = await context.newPage()
    await page.goto(url)
    return page
}

server.listen(3000, (error) => {
    if (error) {
        console.log("something went wrong")
    } else {
        console.log("server is running on port 3000")
    }
})