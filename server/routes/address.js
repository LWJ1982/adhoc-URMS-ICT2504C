const express = require("express");
const { Address, User, UserAddress } = require("../models");
const { validateToken } = require("../middlewares/auth");
const yup = require("yup");
const router = express.Router();
const { sequelize } = require("../models");

// Address validation schema
const addressSchema = yup.object().shape({
  addressLine1: yup.string().required("Address line 1 is required"),
  addressLine2: yup.string(),
  city: yup.string().required("City is required"),
  state: yup.string(),
  postalCode: yup.string().required("Postal code is required").length(6, "Postal code must be 6 characters"),
  country: yup.string().default("SINGAPORE"),
});

// Get all addresses for the authenticated user
router.get("/", validateToken, async (req, res) => {
  try {
    // Use the user.id from the token payload
    const userId = req.user.id;
    
    const userWithAddresses = await User.findByPk(userId, {
      include: [{
        model: Address,
        through: {
          attributes: ['isDefault']
        }
      }]
    });

    if (!userWithAddresses) {
      return res.status(404).json({ message: "User not found" });
    }

    const addresses = userWithAddresses.Addresses.map(address => {
      const addressData = address.toJSON();
      return {
        ...addressData,
        isDefault: address.UserAddress.isDefault
      };
    });

    res.json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get a single address by ID
router.get("/:id", validateToken, async (req, res) => {
  try {
    // Use the user.id from the token payload
    const userId = req.user.id;
    
    const address = await Address.findOne({
      where: { address_id: req.params.id },
      include: {
        model: User,
        where: { id: userId },
        through: { attributes: ['isDefault'] },
      },
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const addressData = address.toJSON();
    const isDefault = address.Users[0].UserAddress.isDefault;

    res.json({
      ...addressData,
      isDefault
    });
  } catch (error) {
    console.error("Error fetching address:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create a new address
router.post("/", validateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Use the user.id from the token payload
    const userId = req.user.id;
    
    // Validate the request body
    await addressSchema.validate(req.body, { abortEarly: false });
    const { isDefault, ...addressData } = req.body;

    // Check if this is the user's first address, set as default if it is
    const userAddressCount = await UserAddress.count({
      where: { user_id: userId }
    });
    
    const shouldBeDefault = isDefault || userAddressCount === 0;

    // Create new address
    const newAddress = await Address.create(addressData, { transaction });
    
    // If this should be the default address, update all others to non-default
    if (shouldBeDefault) {
      await UserAddress.update(
        { isDefault: false },
        { where: { user_id: userId }, transaction }
      );
    }
    
    // Associate address with user
    await UserAddress.create({
      user_id: userId,
      address_id: newAddress.address_id,
      isDefault: shouldBeDefault
    }, { transaction });
    
    await transaction.commit();
    
    res.status(201).json({
      ...newAddress.toJSON(),
      isDefault: shouldBeDefault
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating address:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update an address
router.put("/:id", validateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Use the user.id from the token payload
    const userId = req.user.id;
    
    await addressSchema.validate(req.body, { abortEarly: false });
    
    // Check if address exists and belongs to the user
    const userAddress = await UserAddress.findOne({
      where: { 
        user_id: userId,
        address_id: req.params.id
      }
    });
    
    if (!userAddress) {
      return res.status(404).json({ message: "Address not found or doesn't belong to user" });
    }
    
    const address = await Address.findByPk(req.params.id);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }
    
    const { isDefault, ...addressData } = req.body;
    
    // Update address data
    await address.update(addressData, { transaction });
    
    // Update default status if provided
    if (isDefault !== undefined && isDefault !== userAddress.isDefault) {
      if (isDefault) {
        // If setting as default, unset all other defaults
        await UserAddress.update(
          { isDefault: false },
          { 
            where: { user_id: userId },
            transaction 
          }
        );
      }
      
      await userAddress.update({ isDefault }, { transaction });
    }
    
    await transaction.commit();
    
    res.json({
      ...address.toJSON(),
      isDefault: isDefault !== undefined ? isDefault : userAddress.isDefault
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating address:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Set an address as default
router.patch("/:id/default", validateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Use the user.id from the token payload
    const userId = req.user.id;
    
    // Check if address exists and belongs to the user
    const userAddress = await UserAddress.findOne({
      where: { 
        user_id: userId,
        address_id: req.params.id
      }
    });
    
    if (!userAddress) {
      return res.status(404).json({ message: "Address not found or doesn't belong to user" });
    }
    
    const address = await Address.findByPk(req.params.id);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }
    
    // Set all addresses to non-default
    await UserAddress.update(
      { isDefault: false },
      { 
        where: { user_id: userId },
        transaction 
      }
    );
    
    // Set this address as default
    await userAddress.update({ isDefault: true }, { transaction });
    
    await transaction.commit();
    
    res.json({ 
      message: "Address set as default",
      address: {
        ...address.toJSON(),
        isDefault: true
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error setting default address:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete an address
router.delete("/:id", validateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Use the user.id from the token payload
    const userId = req.user.id;
    
    // Check if address exists and belongs to the user
    const userAddress = await UserAddress.findOne({
      where: { 
        user_id: userId,
        address_id: req.params.id
      }
    });
    
    if (!userAddress) {
      return res.status(404).json({ message: "Address not found or doesn't belong to user" });
    }
    
    const wasDefault = userAddress.isDefault;
    
    // Delete the user-address association
    await userAddress.destroy({ transaction });
    
    // Delete the address
    await Address.destroy({
      where: { address_id: req.params.id },
      transaction
    });
    
    // If this was the default address, set another address as default if available
    if (wasDefault) {
      const anotherUserAddress = await UserAddress.findOne({
        where: { user_id: userId }
      });
      
      if (anotherUserAddress) {
        await anotherUserAddress.update({ isDefault: true }, { transaction });
      }
    }
    
    await transaction.commit();
    
    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;