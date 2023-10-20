import User from "../models/userModel.js"
import Post from "../models/postModel.js"
import bcrypt from 'bcryptjs'
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookies.js"
import { v2 as cloudinary } from "cloudinary"
import mongoose from "mongoose"


const getUserProfile = async (req, res) => {
    // we will fetch the user profile either by username or userId
    //query may be username or userId
    const { query } = req.params
    try {
        let user;

        //query is userId
        if (mongoose.Types.ObjectId.isValid(query)) {
            user = await User.findOne({ _id: query }).select("-password")
        } else {
            user = await User.findOne({ username: query }).select("-password")

        }

        if (!user) return res.status(400).json({ message: "user not found" })

        res.status(200).json(user)

    } catch (error) {
        res.status(500).json({ error: error.message })
        console.log("Error in getUserProfile: ", error.message)
    }
}


//for signup
const signupUser = async (req, res) => {
    try {
        const { name, email, username, password } = req.body
        const user = await User.findOne({ $or: [{ email }, { username }] })

        if (user) {
            return res.status(400).json({ error: 'User already exists' })
        }
        const salt = await bcrypt.genSalt(10)

        const hashedpassword = await bcrypt.hash(password, salt)
        const newUser = new User({
            name,
            email,
            username,
            password: hashedpassword
        })
        await newUser.save()

        if (newUser) {
            generateTokenAndSetCookie(newUser._id, res)
            res.status(201).json({
                _id: newUser._id,
                name: newUser.name,
                username: newUser.username,
                email: newUser.email,
                // profilePic: user.profilePic
            })
        }
        else {
            res.status(400).json({ error: 'invalid' })
        }
    } catch (err) {
        res.status(500).json({ error: err.message })
        console.log("Error in signupUser: ", err.message)

    }
}

//for login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email })
        const isPasswordcorrect = await bcrypt.compare(password, user?.password || "")

        if (!user || !isPasswordcorrect)
            return res.status(400).json({ error: "invalid mail or password" })

        generateTokenAndSetCookie(user._id, res)

        res.status(200).json({
            _id: user._id,
            username: user.username,
            name: user.name,
            email: user.email,
            bio: user.bio,
            profilePic: user.profilePic
        })

    } catch (err) {
        res.status(500).json({ error: err.message })
        console.log("Error in signupUser: ", err.message)
    }

}

//for logout
const logoutUser = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 1 })
        res.status(200).json({ message: "logged out successfully !" })

    } catch (err) {
        res.status(500).json({ error: err.message })
        console.log("Error in signupUser: ", err.message)
    }
}

const followUnfollowUser = async (req, res) => {
    try {
        const { id } = req.params
        const userToModify = await User.findById(id)
        const currentUser = await User.findById(req.user._id)

        if (id === String(req.user._id)) return res.status(400).json({ error: "You cannot follow yourself" })

        if (!userToModify || !currentUser) return res.status(400).json({ error: "user not found" })
        const isFollowing = currentUser.following.includes(id)

        if (isFollowing) {
            //unfollow
            await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } })
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } })
            res.status(200).json({ message: "Unfollowed" })

        } else {
            //follow
            await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } })
            await User.findByIdAndUpdate(req.user._id, { $push: { following: id } })
            res.status(200).json({ message: "followed" })

        }


    } catch (err) {
        res.status(500).json({ error: err.message })
        console.log("Error in FollowUnfollowUser: ", err.message)
    }
}

const updateUser = async (req, res) => {
    const { name, email, username, password, bio } = req.body
    let { profilePic } = req.body
    const userId = req.user._id
    try {
        let user = await User.findById(userId)
        if (!user) return res.status(400).json({ message: "user not found" })

        if (req.params.id !== userId.toString()) return res.status(400).json({ message: "can't update other's profile" })

        if (password) {
            const salt = await bcrypt.genSalt(10)
            const hashedpassword = await bcrypt.hash(password, salt)
            user.password = hashedpassword
        }
        if (profilePic) {
            if (user.profilePic) {
                await cloudinary.uploader.destroy(user.profilePic.split("/").pop().split(".")[0])
            }
            const uploadedResponse = await cloudinary.uploader.upload(profilePic)
            profilePic = uploadedResponse.secure_url
        }
        user.name = name || user.name
        user.email = email || user.email
        user.username = username || user.username
        user.password = user.password
        user.profilePic = profilePic || user.profilePic
        user.bio = bio || user.bio

        user = await user.save()
        await Post.updateMany(
            { "replies.userId": userId }, {
            $set: {
                'replies.$[reply].username': user.username,
                'replies.$[reply].userProfilePic': user.profilePic,
            }
        },
            { arrayFilters: [{ 'reply.userId': userId }] }
        )

        user.password = null
        res.status(200).json(user)
    } catch (err) {
        res.status(500).json({ error: err.message })
        console.log("Error in updateUser: ", err.message)
    }
}
export { signupUser, loginUser, updateUser, logoutUser, followUnfollowUser, getUserProfile }