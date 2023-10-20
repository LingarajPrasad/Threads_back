import jwt from 'jsonwebtoken'

const generateTokenAndSetCookie = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET,{
        expiresIn: '2d'
    })
    res.cookie("jwt",token,{
        httpOnly:true,
        maxAge:15*60*60*1000,
        samesite:'strict'
    })
return token
}

export default generateTokenAndSetCookie