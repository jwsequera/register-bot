const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')
const { EVENTS } = require('@bot-whatsapp/bot')
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const {submitToExcel} = require('./makeService')



// const flowRegistroEdad = addKeyword(["REGISTRO_EDAD"])
//     .addAnswer("Gracias, ¿cuál es tu edad? (Escribe la edad en números). Ejemplo: 25", 
//     {delay: 1500, capture: true},
//     async (ctx, {gotoFlow, endFlow, state, flowDynamic, fallBack}) => {
//         try {
//             const edad = parseInt(ctx.body)
//             return gotoFlow(flowRegistroTelefono);
//         } catch (error) {
//             await flowDynamic({
//                 message: "Por favor, ingresa tu edad en números.",
//                 delay: 1500
//             })
//             return fallBack()
//         }
//     }
//     )

function soloNumeros(cadena) {
    let regex = /^\d+$/;
    return regex.test(cadena);
}

function validarEmail(email) {
    // Expresión regular para validar un correo electrónico
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(email);
}

const flowRegistro = addKeyword("REGISTRO_NOMBRE")
    .addAnswer("Escribe tu nombre completo en un 1 solo mensaje. Ejemplo: Roberto Hernández",
    {capture: true, delay: 1500},
    async (ctx, {state, gotoFlow}) => {
        const nombre = ctx.body
        console.log("NOMBRE", nombre)
        await state.update({nombre: nombre})
        return gotoFlow(flowRegistroEdad)
    }
    ) 

    /*
    .addAnswer(
        ["A continuación, los términos y condiciones de la promoción:", "https://tridenttellevaalemf.com/terminos (Si/No)"], 
        { delay: 5000, capture: true },
        async (ctx, {gotoFlow, endFlow, provider, flowDynamic}) => {
            const message = ctx.body
            if (message.toLowerCase() == "si") {
                await delay(2000)
                await flowDynamic(`¡Para comenzar, es importante que proporciones información real y te asegures de ingresarla correctamente, ya que podrías ser uno de los afortunados ganadores de una de las muchas entradas al EMF que entregaremos!
                `)
                await delay(2000)
                await flowDynamic(`Asegúrate de leer cuidadosamente y seguir las instrucciones que te brinde nuestro Asistente Virtual: 🤖`)
                await delay(2000)
                await flowDynamic(` ✅ Envía todas tus respuestas en un solo mensaje.\n✅ Ten a mano tu factura, ya que la necesitarás. ✅ Ten en cuenta que los datos proporcionados serán utilizados con fines promocionales y comerciales, y aplicans restricciones.`)
                await delay(2000)
                await flowDynamic(`¡Te deseamos mucha suerte en la promoción! 🎉🎉`)
                await delay(2000)
                return gotoFlow(flowRegistro)
            } 
            else if (message.toLowerCase() == "no") {
                return endFlow()
            }
            else {
                return gotoFlow("flowPrincipal")
            }
        }
        )
 */
const flowRegistroEdad = addKeyword("REGISTRO_EDAD").addAnswer("Gracias, ¿cuál es tu edad? (Escribe la edad en números). Ejemplo: 25", 
    {delay: 1500, capture: true},
    async (ctx, {gotoFlow, endFlow, state, flowDynamic, fallBack}) => {
        try {
            const edad = parseInt(ctx.body)
            console.log("EDAD", edad)
            await state.update({edad: edad})
            return gotoFlow(flowRegistroDPI);
        } catch (error) {
            await flowDynamic({
                body: "Por favor, ingresa tu edad en números.",
                delay: 1500
            })
            return fallBack()
        }
    }
    )
const flowRegistroDPI  = addKeyword("REGISTRO_DPI").addAnswer("Para continuar necesitamos tu número de cedula. (Sin guiones ni espacios). Ejemplo: 30123456",
        {delay: 1500, capture: true},
        async (ctx, {gotoFlow, endFlow, state, flowDynamic, fallBack}) => {
            const dpi = ctx.body
            if(soloNumeros(dpi)){
                console.log("DPI", dpi)
                await state.update({dpi: dpi})
                return gotoFlow(flowRegistroEmail)
            }
            else {
                await flowDynamic("Por favor, ingresa tu número de cedula sin guiones ni espacios.")
                await delay(1500)
                return fallBack()
            }
        }
    )
const flowRegistroEmail = addKeyword("REGISTRO_EMAIL").addAnswer("Gracias, ¿cual es tu correo electrónico?",
        {capture: true, delay: 1500},
        async (ctx, {gotoFlow, endFlow, state, flowDynamic, fallBack}) => {
            const email = ctx.body
            if (validarEmail(email)) {
                console.log("EMAIL", email)
                await state.update({email: email})
                return gotoFlow(flowRegistroPago)
            }
            else {
                await flowDynamic("Por favor, ingresa un correo electrónico válido.")
                delay(1500)
                return fallBack()
            }
        }
    )
    const flowRegistroPago = addKeyword("FLOW_IMAGE").addAnswer(`¡Llegaste al último paso! Para confirmar tu participación, envíanos una fotografía de tu ticket *LEGIBLE*. Este paso es REQUISITO para validar tu participación y que puedas convertirte en un posible GANADOR.`,
    {capture: true, delay: 1500},
    async (ctx, {gotoFlow, endFlow, state, flowDynamic, fallBack}) => {
        // if(!state.get('band')) return
        try {
            const DPI = state.get('dpi') ||  "Asdasdasd"
            const nombreTrim = state.get('nombre').replace(/\s/g, '') || "Asdasdasd"
            const buffer = await downloadMediaMessage(ctx, "buffer");
            fs.writeFileSync(`../express-img/img/${DPI}-${nombreTrim}-image.jpeg`, buffer); 
            await state.update({imgUrl: `http://localhost:8080/img/${DPI}-${nombreTrim}-image.jpeg`})
            //--> en esta linea especificas en donde se alojara la imagen, en este ejemplo en la raiz del proyecto
          } catch (err) {
            console.log(err)
            await delay(2000)
            await flowDynamic("Por favor, envía una imagen válida.")
            return fallBack()
          }
        const image = ctx.body
        console.log("IMAGEN", image)
        return gotoFlow(flowFinal)
    }
    )
const flowFinal = addKeyword("FLOW_FINAL").addAnswer([
        "Gracias por tu preferencia!",
        `Ya estás participando en nuestro sorteo para las fabulosas entradas al Empire Music Festival. Recuerda que puedes seguir participando y acumulando más oportunidades de ganar al incluir en tus compras la marca Trident.`,
        `Mantente súper atento de nuestras redes sociales, Facebook: Trident Guatemala e Instagram: *Tridentguate*`,
        `¡Mucha suerte! 🙌`
        ], 
        {delay: 1500},
        async(_, {state, provider}) => {
            await submitToExcel(state.get('nombre'), state.get('edad'), state.get('dpi'), state.get('email'), state.get('imgUrl'), provider)
        }
        )
   
const flowImage = addKeyword(["/image"])
.addAnswer("Por favor, envía la imagen de tu factura.",
    {delay: 1500, capture: true},
    async (ctx, {gotoFlow, endFlow, state, flowDynamic}) => {
        const image = ctx.body
        console.log(image)
        console.log(state)
    }
    )

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const flowPrincipal = addKeyword(["/activar"])
    .addAnswer('Bienvenido al segundo sorteo de la UJAP', {delay: 1500})
    .addAnswer(
        '¡Esperamos seas uno de los ganadores! 🙌',
        { delay: 500},
        null,
        []
    )
    .addAnswer( "Los terminos y condiciones puedes conocerlos en la web de la universidad", {delay: 3000})
    .addAnswer(
        [
            "¿Aceptas nuestros Términos y Condiciones? (Escribe tu respuesta).\nEjemplo: Si Acepto / No Acepto",
        ], 
        { delay: 3000, capture: true },
        async (ctx, {gotoFlow, fallBack, endFlow, provider, state, flowDynamic}) => {
            await state.update({band: true})
            const message = ctx.body
            if (message.toLowerCase() == "si" || message.toLowerCase().includes("si")){
                await delay(2000)
                await flowDynamic(`¡Para comenzar, es importante que proporciones información real y te asegures de ingresarla correctamente, ya que podrías ser uno de los afortunados ganadores `)
                await delay(2000)
                await flowDynamic(`Asegúrate de leer cuidadosamente y seguir las instrucciones que te brinde nuestro Asistente Virtual: 🤖`)
                await delay(2000)
                await flowDynamic(`✅ Envía todas tus respuestas en un solo mensaje.\n✅ Ten a mano tu ticket, ya que la necesitarás. \n✅ Ten en cuenta que los datos proporcionados serán utilizados con fines promocionales y comerciales, y aplican restricciones.`)
                await delay(2000)
                await flowDynamic(`¡Te deseamos mucha suerte en el sorteo! 🎉🎉`)
                await delay(2000)
                return gotoFlow(flowRegistro)
            } 
            else if (message.toLowerCase() == "no"  || message.toLowerCase().includes("no")) {
                return gotoFlow(asegurarTerminos)
            }
            else {
                await delay(2000)
                await flowDynamic("Por favor, selecciona una opción válida.")
                await delay(2000)
                return fallBack()
            }
        }
        )

//en caso de que el usuario diga que no a los términos y condiciones, se le dara una oportunidad mas

const asegurarTerminos = addKeyword(["ASEGURAR_TERMINOS_FLOW"])
        .addAnswer("Lo sentimos para poder participar debes aceptar nuestros términos y condiciones. ¿Deseas aceptar nuestros términos o abandonar la conversación?\n(Escribe tu respuesta). Ejemplo: Aceptar Términos / Abandonar",
        {delay: 1500, capture: true},
        async (ctx, {gotoFlow, endFlow, flowDynamic}) => {
            const message = ctx.body
            if (message.toLowerCase() == "si" || message.toLowerCase().includes("si")  || message.toLowerCase().includes("aceptar") || message.toLowerCase().includes("si acepto") ){
                await delay(2000)
                await flowDynamic(`¡Para comenzar, es importante que proporciones información real y te asegures de ingresarla correctamente, ya que podrías ser uno de los afortunados ganadores! `)
                await delay(2000)
                await flowDynamic(`Asegúrate de leer cuidadosamente y seguir las instrucciones que te brinde nuestro Asistente Virtual: 🤖`)
                await delay(2000)
                await flowDynamic(`✅ Envía todas tus respuestas en un solo mensaje.\n✅ Ten a mano tu factura, ya que la necesitarás. \n✅ Ten en cuenta que los datos proporcionados serán utilizados con fines promocionales y comerciales, y aplican restricciones.`)
                await delay(2000)
                await flowDynamic(`¡Te deseamos mucha suerte en la promoción! 🎉🎉`)
                await delay(2000)
                return gotoFlow(flowRegistro)
            } 
            else if (message.toLowerCase() == "no" || message.toLowerCase().includes == "abandonar" || message.toLowerCase().includes("no") || message.toLowerCase().includes("no acepto")) {
                return endFlow()
            }
            else {
                await flowDynamic("Por favor, selecciona una opción válida.")
                return endFlow()
            }
        }
        )


const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowPrincipal, flowImage, flowFinal, flowRegistro, flowRegistroEdad, flowRegistroDPI, flowRegistroEmail, flowRegistroPago, asegurarTerminos])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
