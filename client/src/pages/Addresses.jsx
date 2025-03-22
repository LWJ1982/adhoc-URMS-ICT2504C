import React, { useEffect, useState } from "react";
import {
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  SpeedDial,
  SpeedDialAction,
  Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";
import { useNavigate } from "react-router-dom";
import http from '../http';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Addresses() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch addresses on component mount
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        // The backend route is simply "/address"
        const response = await http.get("/address");
        setAddresses(response.data);
      } catch (error) {
        console.error("Error fetching addresses:", error);
        toast.error(`Failed to load addresses: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  const handleEdit = (id) => {
    navigate(`/address/edit/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      await http.delete(`/address/${id}`);
      // Update the state to remove the deleted address
      setAddresses(addresses.filter(addr => addr.address_id !== id));
      toast.success("Address deleted successfully");
    } catch (error) {
      toast.error(`Failed to delete address: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      // Use the specific endpoint for setting default address
      await http.patch(`/address/${id}/default`);
      // Refresh the list to show updated default status
      const response = await http.get("/address");
      setAddresses(response.data);
      toast.success("Default address updated");
    } catch (error) {
      toast.error(`Failed to update default address: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) {
    return <Typography>Loading addresses...</Typography>;
  }

  if (!addresses.length) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1">No addresses found.</Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }} 
          onClick={() => navigate("/address")}
        >
          Add New Address
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        User Addresses
      </Typography>
      <Button 
        variant="contained" 
        sx={{ mb: 3 }} 
        onClick={() => navigate("/address")}
      >
        Create New Address
      </Button>
      
      <List sx={{ width: '100%' }}>
        {addresses.map((addr) => (
          <ListItem 
            key={addr.address_id} 
            sx={{ 
              mb: 2, 
              p: 2, 
              border: '1px solid #e0e0e0',
              borderLeft: addr.isDefault ? '4px solid #1976d2' : '1px solid #e0e0e0', 
              borderRadius: 1,
              position: 'relative' 
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {addr.addressLine1}
                </Typography>
                {addr.isDefault && (
                  <Chip 
                    label="Default" 
                    color="primary" 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
              
              {addr.addressLine2 && (
                <Typography variant="body2" color="text.secondary">
                  {addr.addressLine2}
                </Typography>
              )}
              
              <Typography variant="body2">
                {addr.city}, {addr.state} {addr.postalCode}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                {addr.country}
              </Typography>
            </Box>
            
            <SpeedDial
              ariaLabel="Address actions"
              direction="left"
              sx={{ position: "absolute", bottom: 16, right: 16 }}
              icon={<EditIcon />}
              size="small"
            >
              <SpeedDialAction
                icon={<EditIcon />}
                tooltipTitle="Edit"
                onClick={() => handleEdit(addr.address_id)}
              />
              <SpeedDialAction
                icon={<DeleteIcon />}
                tooltipTitle="Delete"
                onClick={() => handleDelete(addr.address_id)}
              />
              {!addr.isDefault && (
                <SpeedDialAction
                  icon={<StarIcon />}
                  tooltipTitle="Set as Default"
                  onClick={() => handleSetDefault(addr.address_id)}
                />
              )}
            </SpeedDial>
          </ListItem>
        ))}
      </List>
      
      <ToastContainer position="bottom-right" />
    </Box>
  );
}

export default Addresses;