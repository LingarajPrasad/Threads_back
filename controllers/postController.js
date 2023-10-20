import User from "../models/userModel.js"
import Post from "../models/postModel.js"
import { v2 as cloudinary } from "cloudinary"


const createPost = async (req, res) => {
    try {
        const { postedBy, text } = req.body
        let { image } = req.body

        if (!postedBy || !text) return res.status(400).json({ error: "Postedby and text field required" })
        const user = await User.findById(postedBy)
        if (!user) return res.status(400).json({ error: "User not found" })

        if (user._id.toString() !== req.user._id.toString())
            return res.status(401).json({ error: "Unauthorized to post" })

        if (text.length > 500) {
            return res.status(400).json({ error: 'Text must be less than 500 characters' })
        }
        if (image) {
            const uploadedResponse = await cloudinary.uploader.upload(image)
            image = uploadedResponse.secure_url
        }
        const newPost = new Post({ postedBy, text, image })
        // console.log(newPost)
        await newPost.save()
        res.status(201).json(newPost)

    } catch (err) {
        res.status(500).json({ error: err.message })
        console.log("Error in createPost: ", err.message)
    }
}

const getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        if (!post) {
            return res.status(404).json({ message: "Post not found" })
        }

        res.status(200).json(post)

    } catch (err) {
        res.status(500).json({ message: err.message })
        console.log("Error in getPost: ", err.message)

    }
}

const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        if (!post) {
            return res.status(404).json({ message: "Post not found" })
        }

        if (post.postedBy.toString() !== req.user._id.toString())
            return res.status(401).json({ message: "Unauthorized action" })

        if(post.image){
            const imgId=post.image.split("/").pop().split(".")[0]
            await cloudinary.uploader.destroy(imgId)
        }
        await Post.findByIdAndDelete(req.params.id)
        return res.status(200).json({ message: "Post was deleted !" })

    } catch (err) {
        res.status(500).json({ message: err.message })
        console.log("Error in getPost: ", err.message)
    }

}

const likeUnlikePost = async (req, res) => {
    try {
        const { id: postId } = req.params
        const userId = req.user._id
        const post = await Post.findById(postId)
        if (!post) {
            return res.status(404).json({ error: "Post not found" })
        }
        const userLikedPost = post.likes.includes(userId)
        if (userLikedPost) {
            //unlike
            await Post.updateOne({ _id: postId }, { $pull: { likes: userId } })
            res.status(200).json({ message: "Unliked" })
        } else {
            //like
            post.likes.push(userId)
            await post.save()
            res.status(200).json({ message: "liked" })

        }
    } catch (err) {
        res.status(500).json({ message: err.message })
        console.log("Error in likeUnlikePost: ", err.message)
    }
}

const replyToPost = async (req, res) => {
    try {
        const { text } = req.body
        const postId = req.params.id
        const userId = req.user._id
        const userProfilePic = req.user.profilePic
        const username = req.user.username
        if (!text) {
            return res.status(400).json({ message: "No text No reply" })
        }
        const post = await Post.findById(postId)
        if (!post) {
            return res.status(400).json({ message: "Post not found" })
        }
        const reply = { userId, text, userProfilePic, username }
        post.replies.push(reply)
        await post.save()
        res.status(200).json(reply)
    } catch (err) {
        res.status(500).json({ message: err.message })
        console.log("Error in replytopost: ", err.message)
    }
}

const feed = async (req, res) => {
    try {
        const userId = req.user._id
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }
        const following = user.following
        const feedPosts = await Post.find({ postedBy: { $in: following } }).sort({ createdAt: -1 })

        res.status(200).json(feedPosts)

    } catch (err) {
        res.status(500).json({ error: err.message })
        console.log("Error in feed: ", err.message)

    }
}

const getUserPost = async (req, res) => {
    const { username } = req.params
    try {
        const user = await User.findOne({ username })
        if (!user) {
            res.status(404).json({ error: 'User Not Found' })
        }
        const posts = await Post.find({ postedBy: user._id }).sort({ createdAt: -1 })
        res.status(200).json(posts)
    } catch (err) {
        res.status(500).json({ error: err.message })
        console.log("Error in getUserPost: ", err.message)
    }
}


export { createPost, feed, getPost, likeUnlikePost, replyToPost, deletePost,getUserPost }