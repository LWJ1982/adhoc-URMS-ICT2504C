const express = require('express');
const router = express.Router();
const { User, Tutorial } = require('../models');
const { Op } = require("sequelize");
const yup = require('yup');
const { validateToken } = require('../middlewares/auth');

//validate token every time by comparing with the token in the database
router.post("/", validateToken, async (req, res) => {
    let data = req.body;
    data.userId = req.user.id;
    // Validate request body
    let validationSchema = yup.object({
        title: yup.string().trim().min(3).max(100).required(),
        description: yup.string().trim().min(3).max(500).required()
    });
    try {
        data = await validationSchema.validate(data,
            { abortEarly: false });
        // Process valid data
        let result = await Tutorial.create(data);
        res.json(result);
    }
    catch (err) {
        res.status(400).json({ errors: err.errors });
    }
});

//search by id
router.get("/:id", validateToken, async (req, res) => {
    let id = req.params.id;
    let tutorial = await Tutorial.findByPk(id, {
        include: { model: User, as: "user", attributes: ['name'] }
    });
    if (!tutorial) {
        res.status(404).json({ error: "The tutorial could not be found." });
        return;
    }

    // Check request user id 
    let userId = req.user.id;
    if (tutorial.userId != userId) {
        res.sendStatus(403);
        return;
    }

    res.json(tutorial);
});

//Search function by filter
router.get("/", validateToken, async (req, res) => {
   
    let userId = req.user.id; // Get the authenticated user's ID
    let condition = { userId }; // Let condition = validated user
    let search = req.query.search;

    if (search) {
        condition[Op.or] = [
            { title: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } }
        ];
    }
    // You can add condition for other columns here
    // e.g. condition.columnName = value;
    let list = await Tutorial.findAll({
        where: condition,
        order: [['createdAt', 'DESC']],
        include: { model: User, as: "user", attributes: ['name'] }
    });

    res.json(list);
});

//update function by id
router.put("/:id", validateToken, async (req, res) => {
    let id = req.params.id;
    let tutorial = await Tutorial.findByPk(id);
    // Check id not found
    if (!tutorial) {
        res.sendStatus(404);
        return;
    }

    // Check request user id 
    let userId = req.user.id;
    if (tutorial.userId != userId) {
        res.sendStatus(403);
        return;
    }

    let data = req.body;

    // Validate request body
    let validationSchema = yup.object({
        title: yup.string().trim().min(3).max(100),
        description: yup.string().trim().min(3).max(500)
    });
    try {
        data = await validationSchema.validate(data,
            { abortEarly: false });

        // Process the data
        let num = await Tutorial.update(data, {
            where: { id: id }
        });
        if (num == 1) {
            res.json({
                message: "Tutorial was updated successfully."
            });
        }
        else {
            res.status(400).json({
                message: `Cannot update tutorial with id ${id}.`
            });
        }
    }
    catch (err) {
        res.status(400).json({ errors: err.errors });
    }


});

router.delete("/:id?", validateToken, async (req, res) => {
    let id = req.params.id;
    let confirm = req.query.confirm; // Read confirmation query parameter
    let userId = req.user.id; // Get authenticated user ID
    let userName = req.user.name
    try {
        let num;

        if (id) {
            // Check request user id 
            let tutorial = await Tutorial.findByPk(id);

            // Check id not found
            if (!tutorial) {
                res.sendStatus(404);
                return;
            }

            if (tutorial.userId != userId) {
                res.sendStatus(403);
                return;
            }

            // Delete a specific tutorial by ID
            num = await Tutorial.destroy({
                where: { id: id }
            });

            if (num === 1) {
                return res.json({ message: "Tutorial was deleted successfully." });
            } else {
                return res.status(400).json({ message: `Cannot delete tutorial with id ${id}.` });
            }
        } else {
            // Ensure confirmation is provided before deleting all
            if (confirm !== "true") {
                return res.status(400).json({
                    message: "To delete all tutorials, add '?confirm=true' to the request."
                });
            }

            // Delete only the authenticated user's all tutorials
            num = await Tutorial.destroy({
                where: { userId }, // Empty condition deletes all records
                //truncate: true, cascade: false, restartIdentity: true,// Ensures IDs reset
                //force: true
            });

            return res.json({ message: `All tutorials from ${userName} were deleted successfully.` });
        }
    } catch (error) {
        return res.status(500).json({ message: "Error deleting tutorial(s)" });
    }
});

module.exports = router;