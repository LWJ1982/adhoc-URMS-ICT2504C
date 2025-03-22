import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { 
  Box, 
  Typography, 
  TextField, 
  Button,
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText,
  DialogActions 
} from '@mui/material';
import http from '../http';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function EditAddress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: ""
  });
  
  // Dialog state
  const [open, setOpen] = useState(false);
  const handleOpen = () => {setOpen(true);};
  const handleClose = () => {setOpen(false);};

  useEffect(() => {
    http.get(`/address/${id}`).then((res) => {
      setAddress(res.data);
      setLoading(false);
    }).catch((err) => {
      toast.error(`Failed to load address: ${err.response?.data?.message || err.message}`);
      setLoading(false);
    });
  }, [id]);

  const validationSchema = yup.object({
    addressLine1: yup.string().trim()
      .min(3, 'Address line 1 must be at least 3 characters')
      .max(100, 'Address line 1 must be at most 100 characters')
      .required('Address line 1 is required'),
    addressLine2: yup.string().trim()
      .max(100, 'Address line 2 must be at most 100 characters'),
    city: yup.string().trim()
      .min(2, 'City must be at least 2 characters')
      .max(50, 'City must be at most 50 characters')
      .required('City is required'),
    state: yup.string().trim()
      .min(2, 'State must be at least 2 characters')
      .max(50, 'State must be at most 50 characters')
      .required('State is required'),
    postalCode: yup.string().trim()
      .min(3, 'Postal code must be at least 3 characters')
      .max(20, 'Postal code must be at most 20 characters')
      .required('Postal code is required'),
    country: yup.string().trim()
      .min(2, 'Country must be at least 2 characters')
      .max(50, 'Country must be at most 50 characters')
      .required('Country is required')
  });

  const formik = useFormik({
    initialValues: address,
    enableReinitialize: true,
    validationSchema: validationSchema,
    onSubmit: (data) => {
      // Trim all string values
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string') {
          data[key] = data[key].trim();
        }
      });

      http.put(`/address/${id}`, data)
        .then((res) => {
          console.log(res.data);
          toast.success("Address updated successfully");
          navigate("/addresses");
        })
        .catch((err) => {
          toast.error(`Failed to update address: ${err.response?.data?.message || err.message}`);
        });
    }
  });

  const deleteAddress = () => {
    http.delete(`/address/${id}`)
      .then((res) => {
        console.log(res.data);
        toast.success("Address deleted successfully");
        navigate("/addresses");
      })
      .catch((err) => {
        toast.error(`Failed to delete address: ${err.response?.data?.message || err.message}`);
      });
  };

  if (loading) {
    return <Typography>Loading address data...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ my: 2 }}>
        Edit Address
      </Typography>
      <Box component="form" onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth margin="dense" autoComplete="off"
          label="Address Line 1"
          name="addressLine1"
          value={formik.values.addressLine1}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.addressLine1 && Boolean(formik.errors.addressLine1)}
          helperText={formik.touched.addressLine1 && formik.errors.addressLine1}
        />
        <TextField
          fullWidth margin="dense" autoComplete="off"
          label="Address Line 2 (Optional)"
          name="addressLine2"
          value={formik.values.addressLine2}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.addressLine2 && Boolean(formik.errors.addressLine2)}
          helperText={formik.touched.addressLine2 && formik.errors.addressLine2}
        />
        <TextField
          fullWidth margin="dense" autoComplete="off"
          label="City"
          name="city"
          value={formik.values.city}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.city && Boolean(formik.errors.city)}
          helperText={formik.touched.city && formik.errors.city}
        />
        <TextField
          fullWidth margin="dense" autoComplete="off"
          label="State"
          name="state"
          value={formik.values.state}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.state && Boolean(formik.errors.state)}
          helperText={formik.touched.state && formik.errors.state}
        />
        <TextField
          fullWidth margin="dense" autoComplete="off"
          label="Postal Code"
          name="postalCode"
          value={formik.values.postalCode}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.postalCode && Boolean(formik.errors.postalCode)}
          helperText={formik.touched.postalCode && formik.errors.postalCode}
        />
        <TextField
          fullWidth margin="dense" autoComplete="off"
          label="Country"
          name="country"
          value={formik.values.country}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.country && Boolean(formik.errors.country)}
          helperText={formik.touched.country && formik.errors.country}
        />
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" type="submit">
            Update
          </Button>
          <Button 
            variant="contained" 
            sx={{ ml: 2 }} 
            color="error"
            onClick={handleOpen}
          >
            Delete
          </Button>
          <Button 
            variant="outlined" 
            sx={{ ml: 2 }} 
            onClick={() => navigate("/addresses")}
          >
            Cancel
          </Button>
        </Box>
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          Delete Address
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this address?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            variant="contained" 
            color="inherit"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={deleteAddress}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EditAddress;