const submitToExcel = async (nombre, edad, DPI, email, imgUrl) => {
    try {
        const jsonPost = `{
            "nombre": "${nombre}",
            "edad": "${edad}",
            "CI": "${DPI}",
            "email": "${email}",
            "img": "${imgUrl}"
        }`;
        const res = await fetch("https://hook.us1.make.com/u1r1v9oebqptfnid1rf5fmhgggtpcobb", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: jsonPost,
        });
        // Intenta obtener la respuesta como texto primero
    } catch (error) {
        console.log(error);
    }
}

// submitToExcel("Juan", "20", "123456789", "asdasd@adsas.asd", "asdsdsaadssad");

module.exports = {
    submitToExcel
}