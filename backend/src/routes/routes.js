import express from 'express';

const router = express.Router()

//get
router.get('/test', (req, res) => {
    // res.json({message: "Test Sucessfull"})
    res.send("Test Sucessfull")
});

export default router;