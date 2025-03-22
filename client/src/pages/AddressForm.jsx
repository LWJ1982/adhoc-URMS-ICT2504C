// src/pages/AddressForm.jsx
import React, { useState, useEffect } from "react";
import { Box, Button, TextField, Typography, Container, Paper, FormControlLabel, Checkbox } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useFormik } from 'formik';
import * as yup from 'yup';
import http from '../http';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AddressForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(id);

  // Creating validation schema that matches backend requirements
  const validationSchema = yup.object({
    addressLine1: yup.string().trim()
      .required('Address line 1 is required')
      .max(100, 'Address line 1 must be at most 100 characters'),
    addressLine2: yup.string().trim()
      .max(100, 'Address line 2 must be at most 100 characters')
      .nullable(),
    city: yup.string().trim()
      .required('City is required')
      .max(50, 'City must be at most 50 characters'),
    state: yup.string().trim()
      .max(50, 'State must be at most 50 characters')
      .nullable(),
    postalCode: yup.string().trim()
      .required('Postal code is required')
      .length(6, 'Postal code must be 6 characters'), // Matching backend validation
    country: yup.string().trim()
      .default('SINGAPORE')
      .max(50, 'Country must be at most 50 characters'),
  });

  const formik = useFormik({
    initialValues: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "SINGAPORE", // Default value as per backend
      isDefault: false // Add isDefault field
    },
    validationSchema: validationSchema,
    onSubmit: (data) => {
      setLoading(true);
      
      // Trim all string values
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string') {
          data[key] = data[key].trim();
        }
      });

      // Use http module for API calls
      const request = isEdit 
        ? http.put(`/addresses/${id}`, data)
        : http.post("/addresses", data);

      request
        .then((response) => {
          toast.success(`Address ${isEdit ? 'updated' : 'created'} successfully`);
          navigate("/addresses");
        })
        .catch((err) => {
          console.error(err);
          if (err.response?.data?.errors) {
            // Handle validation errors from the backend
            const errorMessages = err.response.data.errors.join(', ');
            toast.error(`Validation errors: ${errorMessages}`);
          } else {
            toast.error(`${err.response?.data?.message || 'Failed to save address. Please try again.'}`);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  });

  // Fetch address data for editing
  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      http.get(`/addresses/${id}`)
        .then((res) => {
          // Set form values from the response
          formik.setValues({
            addressLine1: res.data.addressLine1 || "",
            addressLine2: res.data.addressLine2 || "",
            city: res.data.city || "",
            state: res.data.state || "",
            postalCode: res.data.postalCode || "",
            country: res.data.country || "SINGAPORE",
            isDefault: res.data.isDefault || false
          });
        })
        .catch((err) => {
          console.error(err);
          toast.error(`Failed to load address: ${err.response?.data?.message || err.message}`);
          navigate("/addresses");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, isEdit, navigate]);

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEdit ? "Edit Address" : "Create New Address"}
        </Typography>

        <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="addressLine1"
            label="Address Line 1"
            name="addressLine1"
            autoComplete="address-line1"
            value={formik.values.addressLine1}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.addressLine1 && Boolean(formik.errors.addressLine1)}
            helperText={formik.touched.addressLine1 && formik.errors.addressLine1}
            disabled={loading}
          />
          <TextField
            margin="normal"
            fullWidth
            id="addressLine2"
            label="Address Line 2"
            name="addressLine2"
            autoComplete="address-line2"
            value={formik.values.addressLine2}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.addressLine2 && Boolean(formik.errors.addressLine2)}
            helperText={formik.touched.addressLine2 && formik.errors.addressLine2}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="city"
            label="City"
            name="city"
            autoComplete="address-level2"
            value={formik.values.city}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.city && Boolean(formik.errors.city)}
            helperText={formik.touched.city && formik.errors.city}
            disabled={loading}
          />
          <TextField
            margin="normal"
            fullWidth
            id="state"
            label="State/Province"
            name="state"
            autoComplete="address-level1"
            value={formik.values.state}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.state && Boolean(formik.errors.state)}
            helperText={formik.touched.state && formik.errors.state}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="postalCode"
            label="Postal Code"
            name="postalCode"
            autoComplete="postal-code"
            value={formik.values.postalCode}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.postalCode && Boolean(formik.errors.postalCode)}
            helperText={formik.touched.postalCode && formik.errors.postalCode}
            disabled={loading}
            inputProps={{ maxLength: 6 }} // Limit to 6 characters as per backend validation
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="country"
            label="Country"
            name="country"
            autoComplete="country"
            value={formik.values.country}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.country && Boolean(formik.errors.country)}
            helperText={formik.touched.country && formik.errors.country}
            disabled={loading}
          />

          <FormControlLabel
            control={
              <Checkbox
                name="isDefault"
                checked={formik.values.isDefault}
                onChange={formik.handleChange}
                disabled={loading}
              />
            }
            label="Set as default address"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Address"}
          </Button>
          
          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate("/addresses")}
            disabled={loading}
          >
            Cancel
          </Button>
        </Box>
      </Paper>
      <ToastContainer position="bottom-right" />
    </Container>
  );
}

export default AddressForm;