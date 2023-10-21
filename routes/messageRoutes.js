import express from 'express'
import protectRoute from '../middlewares/protectRoute.js'
import { sendMessage,getConversations ,getMessage} from '../controllers/messageController.js'


const router =express()
router.get('/conversations',protectRoute,getConversations)
router.get('/:otherUserId',protectRoute,getMessage)
router.post('/',protectRoute,sendMessage)

export default router
