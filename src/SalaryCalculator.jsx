import React, { useState, useEffect } from 'react';
import {
    Container,
    TextField,
    Button,
    Typography,
    Box,
    Paper,
    Grid,
    MenuItem,
    AppBar,
    Toolbar,
    IconButton,
    Snackbar,
    Alert,
    Stack,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const TAX_SLABS = [
    { upTo: 250000, rate: 0 },
    { upTo: 500000, rate: 0.05 },
    { upTo: 1000000, rate: 0.2 },
    { upTo: Infinity, rate: 0.3 },
];

const DEDUCTION_SCHEMES = [
    { value: '80C', label: 'Section 80C', limit: 150000, helperText: 'Investments in PPF, ELSS, Life Insurance, etc.' },
    { value: '80D', label: 'Section 80D', limit: 25000, helperText: 'Health Insurance Premiums' },
    { value: '80E', label: 'Section 80E', limit: 'No Limit', helperText: 'Interest on Education Loan' },
    { value: '80G', label: 'Section 80G', limit: 'No Limit', helperText: 'Donations to Charitable Institutions' },
    { value: '24B', label: 'Section 24B', limit: 200000, helperText: 'Interest on Housing Loan' },
];

const calculateTax = (taxableIncome) => {
    let tax = 0;
    let remainingIncome = taxableIncome;

    for (const slab of TAX_SLABS) {
        if (remainingIncome > 0) {
            const slabIncome = Math.min(remainingIncome, slab.upTo);
            tax += slabIncome * slab.rate;
            remainingIncome -= slabIncome;
        }
    }

    const cess = tax * 0.04;
    return tax + cess;
};

const SalaryCalculator = () => {
    const [annualSalary, setAnnualSalary] = useState('');
    const [monthlySalary, setMonthlySalary] = useState('');
    const [deductions, setDeductions] = useState([]);
    const [monthlyNetSalary, setMonthlyNetSalary] = useState(0);
    const [annualNetSalary, setAnnualNetSalary] = useState(0);
    const [annualTaxAmount, setAnnualTaxAmount] = useState(0);
    const [taxableIncome, setTaxableIncome] = useState(0);
    const [totalDeductions, setTotalDeductions] = useState(0);
    const [taxSavings, setTaxSavings] = useState(0);
    const [incomeTaxPercentage, setIncomeTaxPercentage] = useState(0);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    useEffect(() => {
        if (annualSalary) {
            const monthly = (parseFloat(annualSalary) / 12).toFixed(2);
            setMonthlySalary(monthly);
        } else if (monthlySalary) {
            const annual = (parseFloat(monthlySalary) * 12).toFixed(2);
            setAnnualSalary(annual);
        }
    }, [annualSalary, monthlySalary]);

    const handleCalculate = () => {
        const grossIncome = parseFloat(annualSalary) || 0;
        const totalDeductions = deductions.reduce((acc, deduction) => acc + parseFloat(deduction.amount || 0), 0);
        const taxableIncome = grossIncome - totalDeductions;

        const tax = calculateTax(taxableIncome);
        const netAnnualSalary = grossIncome - tax;
        const netMonthlySalary = netAnnualSalary / 12;

        const taxSavings = totalDeductions;
        const incomeTaxPercentage = ((tax / grossIncome) * 100).toFixed(2);

        setAnnualNetSalary(netAnnualSalary.toFixed(2));
        setMonthlyNetSalary(netMonthlySalary.toFixed(2));
        setAnnualTaxAmount(tax.toFixed(2));
        setTaxableIncome(taxableIncome.toFixed(2));
        setTotalDeductions(totalDeductions.toFixed(2));
        setTaxSavings(taxSavings.toFixed(2));
        setIncomeTaxPercentage(incomeTaxPercentage);
    };

    const handleAddDeduction = () => {
        setDeductions([...deductions, { scheme: '', amount: '' }]);
    };

    const handleDeductionChange = (index, field, value) => {
        const updatedDeductions = [...deductions];
        updatedDeductions[index][field] = value;

        if (field === 'amount') {
            const scheme = DEDUCTION_SCHEMES.find(scheme => scheme.value === updatedDeductions[index].scheme);
            if (scheme && scheme.limit !== 'No Limit' && parseFloat(value) > scheme.limit) {
                setSnackbarMessage(`The limit for ${scheme.label} is ₹${scheme.limit}`);
                setSnackbarOpen(true);
                updatedDeductions[index][field] = scheme.limit.toString();
            }
        }

        setDeductions(updatedDeductions);
    };

    const handleRemoveDeduction = (index) => {
        const updatedDeductions = deductions.filter((_, i) => i !== index);
        setDeductions(updatedDeductions);
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const handlePrint = () => {
        const input = document.getElementById('tax-deduction-result');
        html2canvas(input)
            .then(canvas => {
                const imgData = canvas.toDataURL('image/png', 100);
                const pdf = new jsPDF();
                pdf.addImage(imgData, 'PNG', 5, 15);
                pdf.save("salary-calculation.pdf");
            });
    };

    return (
        <>
            <Container>
                <AppBar position="static">
                    <Toolbar>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            Tax Deduction Calculator
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Box mt={5}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Paper elevation={3} style={{ padding: 20 }}>
                                <Typography variant="h4" gutterBottom>
                                    Salary Calculator
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Annual Salary"
                                            variant="outlined"
                                            fullWidth
                                            value={annualSalary}
                                            onChange={(e) => setAnnualSalary(e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Monthly Salary"
                                            variant="outlined"
                                            fullWidth
                                            value={monthlySalary}
                                            onChange={(e) => setMonthlySalary(e.target.value)}
                                        />
                                    </Grid>
                                    {deductions.map((deduction, index) => (
                                        <React.Fragment key={index}>
                                            <Grid item xs={6}>
                                                <TextField
                                                    select
                                                    label="Deduction Scheme"
                                                    variant="outlined"
                                                    fullWidth
                                                    value={deduction.scheme}
                                                    onChange={(e) => handleDeductionChange(index, 'scheme', e.target.value)}
                                                    helperText={DEDUCTION_SCHEMES.find(scheme => scheme.value === deduction.scheme)?.helperText || ''}
                                                >
                                                    {DEDUCTION_SCHEMES.map((option) => (
                                                        <MenuItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <TextField
                                                    label="Amount"
                                                    variant="outlined"
                                                    fullWidth
                                                    value={deduction.amount}
                                                    onChange={(e) => handleDeductionChange(index, 'amount', e.target.value)}
                                                />
                                            </Grid>
                                            <Grid item xs={2}>
                                                <IconButton
                                                    aria-label="delete"
                                                    onClick={() => handleRemoveDeduction(index)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Grid>
                                        </React.Fragment>
                                    ))}
                                    <Grid item xs="auto">
                                        <Button variant="contained" color="primary" onClick={handleAddDeduction} > Add Deduction </Button>
                                    </Grid>
                                    <Grid item xs={8}>
                                        <Stack direction="row" spacing={2} justifyContent="end" alignItems="center">
                                            <Button variant="contained" color="success" onClick={handleCalculate} > Calculate </Button>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                        <Grid item xs={6}>
                            {annualNetSalary && monthlyNetSalary && (
                                <>
                                    <div id='tax-deduction-result'>
                                        <Typography>
                                            <h3>Tax Deduction Summary</h3>
                                        </Typography>
                                        <TableContainer component={Paper} sx={{ maxWidth: 500 }}>
                                            <Table aria-label="simple table">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell style={{ fontWeight: "bold" }}>Description</TableCell>
                                                        <TableCell style={{ fontWeight: "bold" }} align="right">Amount</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    <TableRow key="annualIncome" sx={{ 'td': { border: 0, color: 'green' } }} >
                                                        <TableCell scope="row">Gross Salary</TableCell>
                                                        <TableCell align="right">{annualSalary}</TableCell>
                                                    </TableRow>
                                                    {deductions.map((deduction, index) => (
                                                        <TableRow key={deduction.scheme}>
                                                            <TableCell scope="row">
                                                                {deduction.scheme} <br />
                                                                <span style={{ fontSize: '0.8em', color: 'gray' }}>{DEDUCTION_SCHEMES.find(scheme => scheme.value === deduction.scheme)?.helperText}</span>
                                                            </TableCell>
                                                            <TableCell align="right">{deduction.amount}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow key="taxableIncome" sx={{ 'td': { border: 0, color: 'green', fontWeight: 'bold' } }}>
                                                        <TableCell scope="row">Taxable Income</TableCell>
                                                        <TableCell align="right">{taxableIncome}</TableCell>
                                                    </TableRow>
                                                    <TableRow key="annualTaxAmount" sx={{ 'td': { border: 0, color: 'red', fontWeight: 'bold' } }}>
                                                        <TableCell scope="row">Total Tax Deduction</TableCell>
                                                        <TableCell align="right">{annualTaxAmount}</TableCell>
                                                    </TableRow>
                                                    {/* <TableRow key="taxSavings" sx={{ 'td': { border: 0, color: 'blue', fontWeight: 'bold' } }}>
                                                        <TableCell scope="row">Total Tax Savings</TableCell>
                                                        <TableCell align="right">{taxSavings}</TableCell>
                                                    </TableRow> */}
                                                    <TableRow key="incomeTaxPercentage" sx={{ 'td': { border: 0, color: 'blue', fontWeight: 'bold' } }}>
                                                        <TableCell scope="row">Income Tax Percentage</TableCell>
                                                        <TableCell align="right">{incomeTaxPercentage}%</TableCell>
                                                    </TableRow>
                                                    <TableRow key="annualNetSalary" sx={{ 'td': { border: 0, color: 'green', fontWeight: 'bold' } }} >
                                                        <TableCell scope="row">Annual Net Salary</TableCell>
                                                        <TableCell align="right">{annualNetSalary}</TableCell>
                                                    </TableRow>
                                                    <TableRow key="monthlyNetSalary" sx={{ 'td': { border: 0, color: 'green', fontWeight: 'bold' } }} >
                                                        <TableCell scope="row">Monthly Net Salary</TableCell>
                                                        <TableCell align="right">{monthlyNetSalary}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </div>
                                    <br />
                                    <Button variant="contained" color="secondary" onClick={handlePrint} > PDF Download </Button>
                                </>
                            )}
                        </Grid>
                    </Grid>
                </Box>
                <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
                    <Alert onClose={handleSnackbarClose} severity="warning">
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </Container>
        </>
    );
};

export default SalaryCalculator;
