import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  IconButton, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tabs,
  Tab,
  Paper,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
  FormControl,
  InputLabel,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';

// Define interfaces for our data
interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: string;
  paidBy: string;
}

interface Person {
  id: number;
  name: string;
  expenses: Expense[];
}

interface ExpensesData {
  people: Person[];
  totalSpent: number;
}

const ExpensesPage: React.FC = () => {
  // State for expenses data with localStorage persistence
  const [expensesData, setExpensesData] = useState<ExpensesData>(() => {
    try {
      // Try to get saved expenses data from localStorage
      const savedExpenses = localStorage.getItem('dohaExpensesData');
      
      if (savedExpenses) {
        return JSON.parse(savedExpenses);
      } else {
        // Default data with 3 people with specific names
        return {
          people: [
            { id: 1, name: 'Ehsaan', expenses: [] },
            { id: 2, name: 'Amar', expenses: [] },
            { id: 3, name: 'Wahees', expenses: [] }
          ],
          totalSpent: 0
        };
      }
    } catch (error) {
      console.error("Error loading expenses data from localStorage:", error);
      return {
        people: [
          { id: 1, name: 'Ehsaan', expenses: [] },
          { id: 2, name: 'Amar', expenses: [] },
          { id: 3, name: 'Wahees', expenses: [] }
        ],
        totalSpent: 0
      };
    }
  });

  // Add state for currency converter
  const [currencyAmount, setCurrencyAmount] = useState<string>('');
  const [currencyFrom, setCurrencyFrom] = useState<'QAR' | 'GBP'>('QAR');
  const [convertedAmount, setConvertedAmount] = useState<string>('');
  
  // Exchange rates (as of current date)
  const exchangeRates = {
    QAR_TO_GBP: 0.21, // 1 QAR = 0.21 GBP
    GBP_TO_QAR: 4.76  // 1 GBP = 4.76 QAR
  };

  // Save expenses data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('dohaExpensesData', JSON.stringify(expensesData));
    } catch (error) {
      console.error("Error saving expenses data to localStorage:", error);
    }
  }, [expensesData]);

  // State for current tab
  const [currentTab, setCurrentTab] = useState(0);

  // State for dialogs
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [editExpenseDialogOpen, setEditExpenseDialogOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);

  // State for form inputs
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Food',
    paidBy: ''
  });

  // Categories for expenses
  const expenseCategories = [
    'Food', 
    'Transportation', 
    'Accommodation', 
    'Shopping', 
    'Entertainment', 
    'Sightseeing',
    'Other'
  ];

  // Calculate total spent by each person
  const calculatePersonTotal = (personId: number) => {
    const person = expensesData.people.find(p => p.id === personId);
    if (!person) return 0;
    
    // Sum up all expenses where this person is the payer
    return expensesData.people.reduce((total, p) => {
      return total + p.expenses.reduce((sum, expense) => {
        // Only count expenses where this person paid
        return expense.paidBy === person.name ? sum + expense.amount : sum;
      }, 0);
    }, 0);
  };

  // Calculate the total amount spent by all people
  const calculateTotalSpent = () => {
    return expensesData.people.reduce((total, person) => {
      return total + person.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    }, 0);
  };

  // Calculate the average amount each person should pay
  const calculateAveragePerPerson = () => {
    const totalExpenses = calculateTotalSpent();
    return expensesData.people.length > 0 ? totalExpenses / expensesData.people.length : 0;
  };

  // Calculate how much each person has paid
  const calculatePersonPaid = (personName: string) => {
    return expensesData.people.reduce((total, person) => {
      return total + person.expenses.reduce((sum, expense) => {
        return expense.paidBy === personName ? sum + expense.amount : sum;
      }, 0);
    }, 0);
  };

  // Calculate how much each person owes or is owed
  const calculateBalance = (personId: number) => {
    const person = expensesData.people.find(p => p.id === personId);
    if (!person) return 0;
    
    const averagePerPerson = calculateAveragePerPerson();
    const personPaid = calculatePersonPaid(person.name);
    
    // If person paid more than average, they get money back
    // If person paid less than average, they owe money
    return personPaid - averagePerPerson;
  };

  // Calculate detailed balances between people
  const calculateDetailedBalances = () => {
    const balances: { from: string; to: string; amount: number }[] = [];
    const averagePerPerson = calculateAveragePerPerson();
    
    // Calculate how much each person has paid and their balance
    const personBalances = expensesData.people.map(person => ({
      name: person.name,
      paid: calculatePersonPaid(person.name),
      balance: calculatePersonPaid(person.name) - averagePerPerson
    }));
    
    // Sort by balance (descending) - people who are owed money first
    personBalances.sort((a, b) => b.balance - a.balance);
    
    // People with positive balance are owed money
    const creditors = personBalances.filter(p => p.balance > 0);
    // People with negative balance owe money
    const debtors = personBalances.filter(p => p.balance < 0);
    
    // For each person who is owed money
    for (const creditor of creditors) {
      let remainingToReceive = creditor.balance;
      
      // For each person who owes money
      for (let i = 0; i < debtors.length && remainingToReceive > 0.01; i++) {
        const debtor = debtors[i];
        const remainingToPay = Math.abs(debtor.balance);
        
        if (remainingToPay > 0.01) {
          // Calculate how much this debtor should pay to this creditor
          const transferAmount = Math.min(remainingToReceive, remainingToPay);
          
          // Add to balances
          balances.push({
            from: debtor.name,
            to: creditor.name,
            amount: parseFloat(transferAmount.toFixed(2))
          });
          
          // Update remaining amounts
          remainingToReceive -= transferAmount;
          debtor.balance += transferAmount; // Reduce debt (negative becomes less negative)
        }
      }
    }
    
    return balances;
  };

  // Get balances for a specific person
  const getPersonBalances = (personName: string) => {
    const balances = calculateDetailedBalances();
    
    // Balances where this person owes money
    const owes = balances
      .filter(b => b.from === personName)
      .map(b => ({ to: b.to, amount: b.amount }));
    
    // Balances where this person is owed money
    const owed = balances
      .filter(b => b.to === personName)
      .map(b => ({ from: b.from, amount: b.amount }));
    
    return { owes, owed };
  };

  // Format balance text for display
  const formatBalanceText = (personId: number) => {
    const person = expensesData.people.find(p => p.id === personId);
    if (!person) return 'Unknown';
    
    const balance = calculateBalance(personId);
    
    if (Math.abs(balance) < 0.01) {
      return 'Settled';
    }
    
    if (balance > 0) {
      // This person is owed money
      const personBalances = getPersonBalances(person.name);
      
      if (personBalances.owed.length === 0) {
        return `Gets back QAR ${Math.abs(balance).toFixed(2)}`;
      }
      
      if (personBalances.owed.length === 1) {
        return `Gets QAR ${personBalances.owed[0].amount.toFixed(2)} from ${personBalances.owed[0].from}`;
      }
      
      return `Gets back QAR ${Math.abs(balance).toFixed(2)}`;
    } else {
      // This person owes money
      const personBalances = getPersonBalances(person.name);
      
      if (personBalances.owes.length === 0) {
        return `Owes QAR ${Math.abs(balance).toFixed(2)}`;
      }
      
      if (personBalances.owes.length === 1) {
        return `Owes QAR ${personBalances.owes[0].amount.toFixed(2)} to ${personBalances.owes[0].to}`;
      }
      
      return `Owes QAR ${Math.abs(balance).toFixed(2)}`;
    }
  };

  // Handle adding a new expense
  const handleAddExpense = () => {
    if (!selectedPersonId || 
        expenseForm.description.trim() === '' || 
        expenseForm.amount === '') return;
    
    const amount = parseFloat(expenseForm.amount);
    if (isNaN(amount)) return;
    
    const personIndex = expensesData.people.findIndex(p => p.id === selectedPersonId);
    if (personIndex === -1) return;
    
    const newId = expensesData.people[personIndex].expenses.length > 0 
      ? Math.max(...expensesData.people[personIndex].expenses.map(e => e.id)) + 1 
      : 1;
    
    // If paidBy is empty, use the current person's name
    const paidBy = expenseForm.paidBy || expensesData.people[personIndex].name;
    
    const newExpense: Expense = {
      id: newId,
      description: expenseForm.description,
      amount: amount,
      date: expenseForm.date,
      category: expenseForm.category,
      paidBy: paidBy
    };
    
    const updatedPeople = [...expensesData.people];
    updatedPeople[personIndex].expenses.push(newExpense);
    
    setExpensesData({
      ...expensesData,
      people: updatedPeople,
      totalSpent: expensesData.totalSpent + amount
    });
    
    // Reset form
    setExpenseForm({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Food',
      paidBy: ''
    });
    
    setAddExpenseDialogOpen(false);
  };

  // Handle editing an expense
  const handleEditExpense = () => {
    if (!selectedPersonId || !selectedExpenseId || 
        expenseForm.description.trim() === '' || 
        expenseForm.amount === '') return;
    
    const amount = parseFloat(expenseForm.amount);
    if (isNaN(amount)) return;
    
    const personIndex = expensesData.people.findIndex(p => p.id === selectedPersonId);
    if (personIndex === -1) return;
    
    const expenseIndex = expensesData.people[personIndex].expenses.findIndex(e => e.id === selectedExpenseId);
    if (expenseIndex === -1) return;
    
    const oldAmount = expensesData.people[personIndex].expenses[expenseIndex].amount;
    
    // Ensure paidBy is set to a valid person
    const paidBy = expenseForm.paidBy || expensesData.people[personIndex].name;
    
    const updatedPeople = [...expensesData.people];
    updatedPeople[personIndex].expenses[expenseIndex] = {
      ...updatedPeople[personIndex].expenses[expenseIndex],
      description: expenseForm.description,
      amount: amount,
      date: expenseForm.date,
      category: expenseForm.category,
      paidBy: paidBy
    };
    
    setExpensesData({
      ...expensesData,
      people: updatedPeople,
      totalSpent: expensesData.totalSpent - oldAmount + amount
    });
    
    setEditExpenseDialogOpen(false);
    setSelectedExpenseId(null);
  };

  // Handle deleting an expense
  const handleDeleteExpense = (personId: number, expenseId: number) => {
    const personIndex = expensesData.people.findIndex(p => p.id === personId);
    if (personIndex === -1) return;
    
    const expenseIndex = expensesData.people[personIndex].expenses.findIndex(e => e.id === expenseId);
    if (expenseIndex === -1) return;
    
    const amount = expensesData.people[personIndex].expenses[expenseIndex].amount;
    
    const updatedPeople = [...expensesData.people];
    updatedPeople[personIndex].expenses = updatedPeople[personIndex].expenses.filter(e => e.id !== expenseId);
    
    setExpensesData({
      ...expensesData,
      people: updatedPeople,
      totalSpent: expensesData.totalSpent - amount
    });
  };

  // Handle opening the edit expense dialog
  const handleOpenEditExpenseDialog = (personId: number, expenseId: number) => {
    const personIndex = expensesData.people.findIndex(p => p.id === personId);
    if (personIndex === -1) return;
    
    const expenseIndex = expensesData.people[personIndex].expenses.findIndex(e => e.id === expenseId);
    if (expenseIndex === -1) return;
    
    const expense = expensesData.people[personIndex].expenses[expenseIndex];
    
    // Reset form with expense data
    setExpenseForm({
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date,
      category: expense.category,
      paidBy: expense.paidBy
    });
    
    setSelectedPersonId(personId);
    setSelectedExpenseId(expenseId);
    setEditExpenseDialogOpen(true);
  };

  // Handle form input changes
  const handleExpenseFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target as { name: string; value: string };
    setExpenseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle back button click
  const handleBackClick = () => {
    // Go back to previous page
    window.history.back();
  };

  // Handle currency input change
  const handleCurrencyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCurrencyAmount(newValue);
    
    // Automatically update the conversion as the user types
    const amount = parseFloat(newValue);
    if (isNaN(amount)) {
      setConvertedAmount('');
      return;
    }
    
    let result: number;
    if (currencyFrom === 'QAR') {
      result = amount * exchangeRates.QAR_TO_GBP;
      setConvertedAmount(`£${result.toFixed(2)}`);
    } else {
      result = amount * exchangeRates.GBP_TO_QAR;
      setConvertedAmount(`${result.toFixed(2)} QAR`);
    }
  };

  // Handle currency toggle
  const handleCurrencyToggle = () => {
    setCurrencyFrom(prev => prev === 'QAR' ? 'GBP' : 'QAR');
    
    // If there's a value, convert it immediately after toggling
    if (currencyAmount) {
      const amount = parseFloat(currencyAmount);
      if (!isNaN(amount)) {
        let result: number;
        // Note: We need to use the opposite conversion since we're toggling
        if (currencyFrom === 'GBP') { // It will become QAR after toggle
          result = amount * exchangeRates.QAR_TO_GBP;
          setConvertedAmount(`£${result.toFixed(2)}`);
        } else { // It will become GBP after toggle
          result = amount * exchangeRates.GBP_TO_QAR;
          setConvertedAmount(`${result.toFixed(2)} QAR`);
        }
      }
    } else {
      setConvertedAmount('');
    }
  };

  return (
    <Box sx={{ pb: 8 }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center',
        mb: 1
      }}>
        <IconButton sx={{ mr: 1 }} onClick={handleBackClick}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Trip Expenses
        </Typography>
      </Box>
      
      {/* Summary Card */}
      <Box sx={{ px: 2, mb: 3 }}>
        <Card sx={{ 
          borderRadius: 3, 
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(230, 240, 255, 0.8) 0%, rgba(230, 240, 255, 0.9) 100%)',
          border: '1px solid rgba(51, 102, 255, 0.1)'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
              Expense Summary
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Box sx={{ 
                  mb: 2,
                  p: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Total Spent
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    QAR {expensesData.people.reduce(
                      (total, person) => total + person.expenses.reduce((sum, expense) => sum + expense.amount, 0), 
                      0
                    ).toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ 
                  mb: 2,
                  p: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Average PP
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    QAR {calculateAveragePerPerson().toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.dark' }}>
              Balance
            </Typography>
            
            {expensesData.people.map(person => (
              <Box key={person.id} sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 1.5,
                p: 1.5,
                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)',
                borderRadius: 2,
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1A1D1F' }}>
                  {person.name}
                </Typography>
                <Box sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: 4,
                  bgcolor: calculateBalance(person.id) > 0 ? 'rgba(76, 175, 80, 0.1)' : 
                           calculateBalance(person.id) < 0 ? 'rgba(244, 67, 54, 0.1)' : 
                           'rgba(158, 158, 158, 0.1)',
                }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 600,
                      color: calculateBalance(person.id) > 0 ? 'success.main' : 
                             calculateBalance(person.id) < 0 ? 'error.main' : 'text.secondary'
                    }}
                  >
                    {formatBalanceText(person.id)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
      
      {/* Currency Converter */}
      <Box sx={{ px: 2, mb: 3 }}>
        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
              Currency Converter
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                label={`Amount in ${currencyFrom}`}
                variant="outlined"
                size="small"
                value={currencyAmount}
                onChange={handleCurrencyInputChange}
                type="number"
                InputProps={{
                  startAdornment: (
                    <Box component="span" sx={{ mr: 0.5 }}>
                      {currencyFrom === 'QAR' ? 'QAR' : '£'}
                    </Box>
                  ),
                }}
                sx={{ flex: 1 }}
              />
              
              <Button 
                variant="contained" 
                onClick={handleCurrencyToggle}
                sx={{ ml: 1 }}
              >
                Swap
              </Button>
            </Box>
            
            {convertedAmount && (
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'rgba(51, 102, 255, 0.1)', 
                borderRadius: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {currencyFrom === 'QAR' 
                    ? `${currencyAmount} QAR = ${convertedAmount}` 
                    : `£${currencyAmount} = ${convertedAmount}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {currencyFrom === 'QAR' 
                    ? '1 QAR = £0.21' 
                    : '1 GBP = 4.76 QAR'}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
      
      {/* Tabs for People */}
      <Box sx={{ px: 2 }}>
        <Paper sx={{ borderRadius: 3, mb: 2 }}>
          <Tabs 
            value={currentTab} 
            onChange={(_, newValue) => setCurrentTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minWidth: 100
              }
            }}
          >
            {expensesData.people.map((person, index) => (
              <Tab key={person.id} label={person.name} value={index} />
            ))}
          </Tabs>
        </Paper>
        
        {/* Expenses List */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2 
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {expensesData.people[currentTab]?.name}'s Expenses
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
              QAR {calculatePersonTotal(expensesData.people[currentTab]?.id).toFixed(2)}
            </Typography>
          </Box>
          
          {expensesData.people[currentTab]?.expenses.length === 0 ? (
            <Box sx={{ 
              p: 3, 
              textAlign: 'center', 
              backgroundColor: 'rgba(0, 0, 0, 0.02)', 
              borderRadius: 2 
            }}>
              <ReceiptIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                No expenses added yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click the + button to add an expense
              </Typography>
            </Box>
          ) : (
            <List sx={{ 
              bgcolor: 'background.paper',
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              {expensesData.people[currentTab]?.expenses
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(expense => (
                <React.Fragment key={expense.id}>
                  <ListItem 
                    sx={{ 
                      py: 2,
                      px: 2,
                      position: 'relative',
                      '&:hover .expense-actions': {
                        opacity: 1
                      }
                    }}
                  >
                    <Box sx={{ 
                      mr: 2, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      minWidth: '50px',
                      bgcolor: 'rgba(51, 102, 255, 0.1)',
                      p: 1,
                      borderRadius: 2
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(expense.date).toLocaleDateString('en-US', { month: 'short' })}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {new Date(expense.date).getDate()}
                      </Typography>
                    </Box>
                    <ListItemText 
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {expense.description}
                        </Typography>
                      }
                      secondary={
                        <React.Fragment>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Box 
                              sx={{ 
                                bgcolor: 'rgba(51, 102, 255, 0.1)', 
                                px: 1, 
                                py: 0.5, 
                                borderRadius: 1,
                                mr: 1
                              }}
                            >
                              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                                {expense.category}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" component="span">
                              Paid by {expense.paidBy}
                            </Typography>
                          </Box>
                        </React.Fragment>
                      }
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        QAR {expense.amount.toFixed(2)}
                      </Typography>
                    </Box>
                    {/* Floating action buttons */}
                    <Box 
                      className="expense-actions"
                      sx={{ 
                        position: 'absolute',
                        right: 16,
                        bottom: -20,
                        zIndex: 10,
                        display: 'flex',
                        opacity: 1, // Always visible for now to match screenshot
                        transition: 'opacity 0.2s'
                      }}
                    >
                      <Fab
                        size="small"
                        aria-label="add"
                        onClick={() => handleDeleteExpense(expensesData.people[currentTab].id, expense.id)}
                        sx={{ 
                          bgcolor: 'primary.main',
                          color: 'white',
                          width: 36,
                          height: 36,
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                          boxShadow: '0 2px 8px rgba(51, 102, 255, 0.3)'
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </Fab>
                    </Box>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Box>
      
      {/* Add Expense FAB */}
      <Fab 
        color="primary" 
        aria-label="add expense" 
        sx={{ 
          position: 'fixed', 
          bottom: 80, 
          right: 16,
          width: 56,
          height: 56,
          boxShadow: '0 4px 12px rgba(51, 102, 255, 0.3)'
        }}
        onClick={() => {
          setSelectedPersonId(expensesData.people[currentTab]?.id);
          setAddExpenseDialogOpen(true);
        }}
      >
        <AddIcon />
      </Fab>
      
      {/* Add Expense Dialog */}
      <Dialog 
        open={addExpenseDialogOpen} 
        onClose={() => setAddExpenseDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            width: '100%',
            maxWidth: 500
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Add New Expense
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            value={expenseForm.description}
            onChange={handleExpenseFormChange}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            margin="dense"
            name="amount"
            label="Amount"
            type="number"
            fullWidth
            value={expenseForm.amount}
            onChange={handleExpenseFormChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">QAR</InputAdornment>,
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="date"
            label="Date"
            type="date"
            fullWidth
            value={expenseForm.date}
            onChange={handleExpenseFormChange}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              name="category"
              value={expenseForm.category}
              label="Category"
              onChange={handleExpenseFormChange}
            >
              {expenseCategories.map(category => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="paid-by-label">Paid By</InputLabel>
            <Select
              labelId="paid-by-label"
              name="paidBy"
              value={expenseForm.paidBy}
              label="Paid By"
              onChange={handleExpenseFormChange}
            >
              {expenseForm.paidBy === '' && (
                <MenuItem value="">
                  <em>{expensesData.people.find(p => p.id === selectedPersonId)?.name || 'Self'}</em>
                </MenuItem>
              )}
              {expensesData.people.map(person => (
                <MenuItem key={person.id} value={person.name}>{person.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setAddExpenseDialogOpen(false)}
            sx={{ 
              borderRadius: 2,
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddExpense} 
            variant="contained" 
            color="primary"
            sx={{ 
              borderRadius: 2,
              px: 3
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Expense Dialog */}
      <Dialog 
        open={editExpenseDialogOpen} 
        onClose={() => setEditExpenseDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            width: '100%',
            maxWidth: 500
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Edit Expense
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            value={expenseForm.description}
            onChange={handleExpenseFormChange}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            margin="dense"
            name="amount"
            label="Amount"
            type="number"
            fullWidth
            value={expenseForm.amount}
            onChange={handleExpenseFormChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">QAR</InputAdornment>,
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="date"
            label="Date"
            type="date"
            fullWidth
            value={expenseForm.date}
            onChange={handleExpenseFormChange}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="category-label-edit">Category</InputLabel>
            <Select
              labelId="category-label-edit"
              name="category"
              value={expenseForm.category}
              label="Category"
              onChange={handleExpenseFormChange}
            >
              {expenseCategories.map(category => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="paid-by-label-edit">Paid By</InputLabel>
            <Select
              labelId="paid-by-label-edit"
              name="paidBy"
              value={expenseForm.paidBy}
              label="Paid By"
              onChange={handleExpenseFormChange}
            >
              {expensesData.people.map(person => (
                <MenuItem key={person.id} value={person.name}>{person.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setEditExpenseDialogOpen(false)}
            sx={{ 
              borderRadius: 2,
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEditExpense} 
            variant="contained" 
            color="primary"
            sx={{ 
              borderRadius: 2,
              px: 3
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpensesPage; 