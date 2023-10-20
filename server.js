import express from "express"
import dotenv from 'dotenv'
import connectDB from "./db/connectDB.js"
import cookieParser from "cookie-parser"
import userRoutes from "./routes/userRoutes.js"
import postRoutes from "./routes/postRoutes.js"
import {v2 as cloudinary} from "cloudinary"
dotenv.config()
connectDB()
const app = express();
const PORT=process.env.PORT || 5000
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

app.use(express.json({limit:"10mb"}))
//On Cloudinary's free plan, the maximum image file size which can be uploaded to Cloudinary or created via Transformations is 10 MB, and the maximum video file size is 100 MB. "Raw" files, other than images or videos, are also limited to 10 MB.
app.use(express.urlencoded({extended:false}))
app.use(cookieParser())

app.use('/api/users',userRoutes)
app.use('/api/posts',postRoutes)

app.listen(5000,()=>console.log(`Server started at http://localhost:${PORT}`))