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
  InputAdornment,
  RadioGroup,
  Radio,
  FormControlLabel,
  Checkbox,
  Chip,
  FormLabel,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SplitscreenIcon from '@mui/icons-material/Splitscreen';
import InfoIcon from '@mui/icons-material/Info';
import { useFirebase } from '../contexts/FirebaseContext';

// Define interfaces for our data
interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: string;
  paidBy: string;
  timestamp?: string; // Make optional to match FirebaseContext
  split?: {
    type: 'equal' | 'custom' | 'percentage';
    details?: {
      personName: string;
      amount?: number;
      percentage?: number;
    }[];
  };
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
  const { expensesData, updateExpensesData } = useFirebase();
  
  // Add state for currency converter
  const [currencyAmount, setCurrencyAmount] = useState<string>('');
  const [currencyFrom, setCurrencyFrom] = useState<'QAR' | 'GBP'>('QAR');
  const [convertedAmount, setConvertedAmount] = useState<string>('');
  
  // Exchange rates (as of current date)
  const exchangeRates = {
    QAR_TO_GBP: 0.21, // 1 QAR = 0.21 GBP
    GBP_TO_QAR: 4.76  // 1 GBP = 4.76 QAR
  };

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
    paidBy: '',
    split: {
      type: 'equal' as 'equal' | 'custom' | 'percentage',
      details: [] as {
        personName: string;
        amount?: number;
        percentage?: number;
        included?: boolean;
      }[]
    }
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
    if (!expensesData || !expensesData.people || !Array.isArray(expensesData.people)) {
      return 0;
    }
    
    const person = expensesData.people.find(p => p.id === personId);
    if (!person) return 0;
    
    // Sum up all expenses where this person is the payer
    return expensesData.people.reduce((total, p) => {
      if (!p.expenses || !Array.isArray(p.expenses)) {
        return total;
      }
      return total + p.expenses.reduce((sum, expense) => {
        // Only count expenses where this person paid
        return expense.paidBy === person.name ? sum + expense.amount : sum;
      }, 0);
    }, 0);
  };

  // Calculate total amount owed to each person by others
  const calculatePersonOwed = (personId: number) => {
    if (!expensesData || !expensesData.people || !Array.isArray(expensesData.people)) {
      return 0;
    }
    
    const person = expensesData.people.find(p => p.id === personId);
    if (!person) return 0;
    
    let totalOwed = 0;
    
    // Loop through all expenses in all people
    expensesData.people.forEach(p => {
      if (!p.expenses || !Array.isArray(p.expenses)) return;
      
      p.expenses.forEach(expense => {
        // Skip if this person is not the payer
        if (expense.paidBy !== person.name) return;
        
        // Handle different split types
        if (expense.split?.type === 'equal') {
          // For equal splits, everyone pays an equal share except the payer
          const includedPeople = expense.split?.details 
            ? expense.split.details.length 
            : expensesData.people.length;
          
          if (includedPeople > 0) {
            // Amount owed by others (total minus this person's share)
            const sharePerPerson = expense.amount / includedPeople;
            totalOwed += expense.amount - sharePerPerson;
          }
        } 
        else if (expense.split?.type === 'custom' && expense.split.details) {
          // For custom splits, sum up all amounts for people other than the payer
          expense.split.details.forEach(detail => {
            if (detail.personName !== person.name && detail.amount) {
              totalOwed += detail.amount;
            }
          });
        }
        else if (expense.split?.type === 'percentage' && expense.split.details) {
          // For percentage splits, calculate based on percentages
          expense.split.details.forEach(detail => {
            if (detail.personName !== person.name && detail.percentage) {
              totalOwed += (expense.amount * detail.percentage) / 100;
            }
          });
        }
        else {
          // Default behavior if no split specified: equal split among all people
          const sharePerPerson = expense.amount / expensesData.people.length;
          totalOwed += expense.amount - sharePerPerson;
        }
      });
    });
    
    return totalOwed;
  };

  // Calculate total amount this person owes to others
  const calculatePersonOwes = (personId: number) => {
    if (!expensesData || !expensesData.people || !Array.isArray(expensesData.people)) {
      return 0;
    }
    
    const person = expensesData.people.find(p => p.id === personId);
    if (!person) return 0;
    
    let totalOwes = 0;
    
    // Loop through all expenses in all people
    expensesData.people.forEach(p => {
      if (!p.expenses || !Array.isArray(p.expenses)) return;
      
      p.expenses.forEach(expense => {
        // Skip if this person is the payer
        if (expense.paidBy === person.name) return;
        
        // Handle different split types
        if (expense.split?.type === 'equal') {
          // For equal splits, check if person is included
          const isIncluded = !expense.split.details || 
            expense.split.details.some(detail => detail.personName === person.name);
          
          if (isIncluded) {
            // Calculate equal share
            const includedCount = expense.split.details?.length || expensesData.people.length;
            totalOwes += expense.amount / includedCount;
          }
        } 
        else if (expense.split?.type === 'custom' && expense.split.details) {
          // For custom splits, find this person's amount
          const personDetail = expense.split.details.find(detail => detail.personName === person.name);
          if (personDetail && personDetail.amount) {
            totalOwes += personDetail.amount;
          }
        }
        else if (expense.split?.type === 'percentage' && expense.split.details) {
          // For percentage splits, calculate based on this person's percentage
          const personDetail = expense.split.details.find(detail => detail.personName === person.name);
          if (personDetail && personDetail.percentage) {
            totalOwes += (expense.amount * personDetail.percentage) / 100;
          }
        }
        else {
          // Default behavior if no split specified
          totalOwes += expense.amount / expensesData.people.length;
        }
      });
    });
    
    return totalOwes;
  };

  // Calculate the total amount spent by all people
  const calculateTotalSpent = () => {
    if (!expensesData || !expensesData.people || !Array.isArray(expensesData.people)) {
      return 0;
    }
    
    return expensesData.people.reduce((total, person) => {
      if (!person.expenses || !Array.isArray(person.expenses)) {
        return total;
      }
      return total + person.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    }, 0);
  };

  // Calculate the average amount each person should pay
  const calculateAveragePerPerson = () => {
    if (!expensesData || !expensesData.people || !Array.isArray(expensesData.people)) {
      return 0;
    }
    
    const totalExpenses = calculateTotalSpent();
    return expensesData.people.length > 0 ? totalExpenses / expensesData.people.length : 0;
  };

  // Calculate how much each person has paid
  const calculatePersonPaid = (personName: string) => {
    if (!expensesData || !expensesData.people || !Array.isArray(expensesData.people)) {
      return 0;
    }
    
    return expensesData.people.reduce((total, person) => {
      if (!person.expenses || !Array.isArray(person.expenses)) {
        return total;
      }
      return total + person.expenses.reduce((sum, expense) => {
        return expense.paidBy === personName ? sum + expense.amount : sum;
      }, 0);
    }, 0);
  };

  // Calculate how much each person owes or is owed
  const calculateBalance = (personId: number) => {
    if (!expensesData || !expensesData.people || !Array.isArray(expensesData.people)) {
      return 0;
    }
    
    const person = expensesData.people.find(p => p.id === personId);
    if (!person) return 0;
    
    // How much this person paid
    const personPaid = calculatePersonPaid(person.name);
    
    // How much this person owes to others
    const personOwes = calculatePersonOwes(personId);
    
    // How much others owe to this person
    const personOwed = calculatePersonOwed(personId);
    
    // Final balance
    // Positive: person gets money back
    // Negative: person owes money
    return personPaid - personOwes;
  };

  // Calculate detailed balances between people for the most efficient settlement
  const calculateDetailedBalances = () => {
    const balances: { from: string; to: string; amount: number }[] = [];
    
    if (!expensesData || !expensesData.people || !Array.isArray(expensesData.people)) {
      return balances;
    }
    
    // Calculate the fair share per person (equal split among all people)
    const totalSpent = expensesData.people.reduce((total, person) => {
      if (!person.expenses || !Array.isArray(person.expenses)) {
        return total;
      }
      return total + person.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    }, 0);
    
    const fairShare = totalSpent / expensesData.people.length;
    
    // Calculate how much each person paid and their balance
    const personBalances = expensesData.people.map(person => {
      const paid = expensesData.people.reduce((total, p) => {
        if (!p.expenses || !Array.isArray(p.expenses)) {
          return total;
        }
        return total + p.expenses.reduce((sum, expense) => {
          // Only count expenses where this person paid
          return expense.paidBy === person.name ? sum + expense.amount : sum;
        }, 0);
      }, 0);
      
      return {
        name: person.name,
        balance: paid - fairShare // Positive: gets money back, Negative: owes money
      };
    });
    
    // Sort by balance (descending) - people who are owed money first
    personBalances.sort((a, b) => b.balance - a.balance);
    
    // People with positive balance are owed money
    const creditors = personBalances.filter(p => p.balance > 0.01); // Use small epsilon to handle floating point
    // People with negative balance owe money
    const debtors = personBalances.filter(p => p.balance < -0.01);
    
    // For each person who is owed money
    for (const creditor of creditors) {
      let remainingToReceive = creditor.balance;
      
      // For each person who owes money
      for (let i = 0; i < debtors.length && remainingToReceive > 0.01; i++) {
        if (debtors[i].balance >= -0.01) continue; // Skip if this debtor's balance is already settled
        
        const remainingToPay = Math.abs(debtors[i].balance);
        
        if (remainingToPay > 0.01) {
          // Calculate how much this debtor should pay to this creditor
          const transferAmount = Math.min(remainingToReceive, remainingToPay);
          
          // Round to 2 decimal places to avoid tiny transfers
          const roundedAmount = Math.round(transferAmount * 100) / 100;
          
          if (roundedAmount > 0.01) {
            // Add to balances
            balances.push({
              from: debtors[i].name,
              to: creditor.name,
              amount: roundedAmount
            });
            
            // Update remaining amounts
            remainingToReceive -= roundedAmount;
            debtors[i].balance += roundedAmount; // Reduce debt (negative becomes less negative)
          }
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
    if (!expensesData || !expensesData.people || !Array.isArray(expensesData.people)) {
      return 'Unknown';
    }
    
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
    if (!expensesData || !expensesData.people || !Array.isArray(expensesData.people) ||
        !selectedPersonId || 
        expenseForm.description.trim() === '' || 
        expenseForm.amount === '') return;
    
    const amount = parseFloat(expenseForm.amount);
    if (isNaN(amount)) return;
    
    const personIndex = expensesData.people.findIndex(p => p.id === selectedPersonId);
    if (personIndex === -1) return;
    
    const newId = expensesData.people[personIndex].expenses && Array.isArray(expensesData.people[personIndex].expenses) && expensesData.people[personIndex].expenses.length > 0 
      ? Math.max(...expensesData.people[personIndex].expenses.map(e => e.id)) + 1 
      : 1;
    
    // If paidBy is empty, use the current person's name
    const paidBy = expenseForm.paidBy || expensesData.people[personIndex].name;
    
    // Process split details for saving - only include fields that have values
    const includedPeople = expenseForm.split.details.filter(detail => detail.included !== false);
    
    // Only add split details if there are included people and it's not an equal split
    let splitConfig: {
      type: 'equal' | 'custom' | 'percentage';
      details?: {
        personName: string;
        amount?: number;
        percentage?: number;
      }[];
    } = {
      type: expenseForm.split.type
    };
    
    // For all split types, create a properly structured split configuration
    if (includedPeople.length > 0) {
      // Create clean split details without undefined values
      const cleanDetails = includedPeople.map(detail => {
        const cleanDetail: { personName: string; amount?: number; percentage?: number } = {
          personName: detail.personName
        };
        
        if (expenseForm.split.type === 'custom' && typeof detail.amount === 'number') {
          cleanDetail.amount = detail.amount;
        } else if (expenseForm.split.type === 'percentage' && typeof detail.percentage === 'number') {
          cleanDetail.percentage = detail.percentage;
        }
        
        return cleanDetail;
      });
      
      if (cleanDetails.length > 0) {
        splitConfig.details = cleanDetails;
      }
    }
    
    const newExpense: Expense = {
      id: newId,
      description: expenseForm.description,
      amount: amount,
      date: expenseForm.date,
      category: expenseForm.category,
      paidBy: paidBy,
      timestamp: new Date().toISOString(),
      split: splitConfig
    };
    
    // Deep clone the current expenses data to avoid mutation issues
    const updatedPeople = JSON.parse(JSON.stringify(expensesData.people));
    
    // Ensure expenses array exists
    if (!updatedPeople[personIndex].expenses) {
      updatedPeople[personIndex].expenses = [];
    }
    
    updatedPeople[personIndex].expenses.push(newExpense);
      
    // Show feedback to user that expense is being added
    console.log(`Adding expense: ${newExpense.description} for ${amount.toFixed(2)} QAR`);
      
    // Update expenses data in Firebase with metadata
    updateExpensesData({
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
      paidBy: '',
      split: {
        type: 'equal',
        details: []
      }
    });
    
    setAddExpenseDialogOpen(false);
  };

  // Handle editing an expense
  const handleEditExpense = () => {
    if (!expensesData || !expensesData.people || !Array.isArray(expensesData.people) ||
        !selectedPersonId || !selectedExpenseId || 
        expenseForm.description.trim() === '' || 
        expenseForm.amount === '') return;
    
    const amount = parseFloat(expenseForm.amount);
    if (isNaN(amount)) return;
    
    const personIndex = expensesData.people.findIndex(p => p.id === selectedPersonId);
    if (personIndex === -1) return;
    
    if (!expensesData.people[personIndex].expenses || !Array.isArray(expensesData.people[personIndex].expenses)) {
      return;
    }
    
    const expenseIndex = expensesData.people[personIndex].expenses.findIndex(e => e.id === selectedExpenseId);
    if (expenseIndex === -1) return;
    
    const oldAmount = expensesData.people[personIndex].expenses[expenseIndex].amount;
    
    // Ensure paidBy is set to a valid person
    const paidBy = expenseForm.paidBy || expensesData.people[personIndex].name;
    
    // Process split details for saving - only include fields that have values
    const includedPeople = expenseForm.split.details.filter(detail => detail.included !== false);
    
    // Only add split details if there are included people and it's not an equal split
    let splitConfig: {
      type: 'equal' | 'custom' | 'percentage';
      details?: {
        personName: string;
        amount?: number;
        percentage?: number;
      }[];
    } = {
      type: expenseForm.split.type
    };
    
    // For all split types, create a properly structured split configuration
    if (includedPeople.length > 0) {
      // Create clean split details without undefined values
      const cleanDetails = includedPeople.map(detail => {
        const cleanDetail: { personName: string; amount?: number; percentage?: number } = {
          personName: detail.personName
        };
        
        if (expenseForm.split.type === 'custom' && typeof detail.amount === 'number') {
          cleanDetail.amount = detail.amount;
        } else if (expenseForm.split.type === 'percentage' && typeof detail.percentage === 'number') {
          cleanDetail.percentage = detail.percentage;
        }
        
        return cleanDetail;
      });
      
      if (cleanDetails.length > 0) {
        splitConfig.details = cleanDetails;
      }
    }
    
    const updatedPeople = [...expensesData.people];
    updatedPeople[personIndex].expenses[expenseIndex] = {
      ...updatedPeople[personIndex].expenses[expenseIndex],
      description: expenseForm.description,
      amount: amount,
      date: expenseForm.date,
      category: expenseForm.category,
      paidBy: paidBy,
      split: splitConfig
    };
    
    updateExpensesData({
      ...expensesData,
      people: updatedPeople,
      totalSpent: expensesData.totalSpent - oldAmount + amount
    });
    
    setEditExpenseDialogOpen(false);
    setSelectedExpenseId(null);
  };

  // Handle deleting an expense
  const handleDeleteExpense = (personId: number, expenseId: number) => {
    if (!expensesData || !expensesData.people || !Array.isArray(expensesData.people)) {
      return;
    }
    
    const personIndex = expensesData.people.findIndex(p => p.id === personId);
    if (personIndex === -1) return;
    
    if (!expensesData.people[personIndex].expenses || !Array.isArray(expensesData.people[personIndex].expenses)) {
      return;
    }
    
    const expenseIndex = expensesData.people[personIndex].expenses.findIndex(e => e.id === expenseId);
    if (expenseIndex === -1) return;
    
    const amount = expensesData.people[personIndex].expenses[expenseIndex].amount;
    
    const updatedPeople = [...expensesData.people];
    updatedPeople[personIndex].expenses = updatedPeople[personIndex].expenses.filter(e => e.id !== expenseId);
    
    updateExpensesData({
      ...expensesData,
      people: updatedPeople,
      totalSpent: expensesData.totalSpent - amount
    });
  };

  // Handle opening the edit expense dialog
  const handleOpenEditExpenseDialog = (personId: number, expenseId: number) => {
    if (!expensesData || !expensesData.people || !Array.isArray(expensesData.people)) {
      return;
    }
    
    const personIndex = expensesData.people.findIndex(p => p.id === personId);
    if (personIndex === -1) return;
    
    if (!expensesData.people[personIndex].expenses || !Array.isArray(expensesData.people[personIndex].expenses)) {
      return;
    }
    
    const expenseIndex = expensesData.people[personIndex].expenses.findIndex(e => e.id === expenseId);
    if (expenseIndex === -1) return;
    
    const expense = expensesData.people[personIndex].expenses[expenseIndex];
    
    // Prepare split details
    let splitDetails: {
      personName: string;
      amount?: number;
      percentage?: number;
      included?: boolean;
    }[] = [];
    
    if (expense.split && expense.split.details) {
      // Use existing split details
      const includedNames = expense.split.details.map(d => d.personName);
      
      splitDetails = expensesData.people.map(person => {
        const existingDetail = expense.split?.details?.find(d => d.personName === person.name);
        const included = includedNames.includes(person.name);
        
        if (existingDetail) {
          return {
            ...existingDetail,
            included
          };
        } else {
          return {
            personName: person.name,
            included: false
          };
        }
      });
    } else {
      // Create default split details
      splitDetails = expensesData.people.map(person => ({
        personName: person.name,
        included: true
      }));
    }
    
    // Reset form with expense data
    setExpenseForm({
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date,
      category: expense.category,
      paidBy: expense.paidBy,
      split: {
        type: expense.split?.type || 'equal',
        details: splitDetails
      }
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
    
    if (name === 'amount' && value && expenseForm.split.type !== 'equal') {
      // When amount changes, update the custom split amounts if using a non-equal split
      const amount = parseFloat(value);
      if (!isNaN(amount) && expensesData && expensesData.people) {
        // Create or update split details based on the new amount
        const splitDetails = expensesData.people.map(person => {
          const existingDetail = expenseForm.split.details.find(d => d.personName === person.name);
          
          if (expenseForm.split.type === 'percentage') {
            return {
              personName: person.name,
              percentage: existingDetail?.percentage || 100 / expensesData.people.length,
              included: existingDetail?.included !== false // Default to included
            };
          } else { // custom split
            return {
              personName: person.name,
              amount: existingDetail?.amount || amount / expensesData.people.length,
              included: existingDetail?.included !== false // Default to included
            };
          }
        });
        
        setExpenseForm(prev => ({
          ...prev,
          [name]: value,
          split: {
            ...prev.split,
            details: splitDetails
          }
        }));
        return;
      }
    }
    
    setExpenseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle split type change
  const handleSplitTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const splitType = e.target.value as 'equal' | 'custom' | 'percentage';
    
    // Generate new split details based on the selected type
    let splitDetails: {
      personName: string;
      amount?: number;
      percentage?: number;
      included?: boolean;
    }[] = [];
    
    if (expensesData && expensesData.people) {
      const amount = parseFloat(expenseForm.amount);
      
      splitDetails = expensesData.people.map(person => {
        const existingDetail = expenseForm.split.details.find(d => d.personName === person.name);
        const included = existingDetail?.included !== false; // Default to included
        
        if (splitType === 'percentage') {
          return {
            personName: person.name,
            percentage: included ? 100 / expensesData.people.length : 0,
            included
          };
        } else if (splitType === 'custom' && !isNaN(amount)) {
          return {
            personName: person.name,
            amount: included ? amount / expensesData.people.length : 0,
            included
          };
        } else {
          return {
            personName: person.name,
            included
          };
        }
      });
    }
    
    setExpenseForm(prev => ({
      ...prev,
      split: {
        type: splitType,
        details: splitDetails
      }
    }));
  };

  // Handle person inclusion in split
  const handlePersonIncluded = (personName: string, included: boolean) => {
    setExpenseForm(prev => {
      const amount = parseFloat(prev.amount);
      const newDetails = [...prev.split.details];
      const index = newDetails.findIndex(d => d.personName === personName);
      
      if (index !== -1) {
        newDetails[index] = {
          ...newDetails[index],
          included
        };
        
        // Recalculate amounts/percentages for included people
        const includedCount = newDetails.filter(d => d.included).length;
        
        if (prev.split.type === 'percentage' && includedCount > 0) {
          // Distribute percentages evenly among included people
          newDetails.forEach(detail => {
            if (detail.included) {
              detail.percentage = 100 / includedCount;
            } else {
              detail.percentage = 0;
            }
          });
        } else if (prev.split.type === 'custom' && !isNaN(amount) && includedCount > 0) {
          // Distribute amounts evenly among included people
          newDetails.forEach(detail => {
            if (detail.included) {
              detail.amount = amount / includedCount;
            } else {
              detail.amount = 0;
            }
          });
        }
      }
      
      return {
        ...prev,
        split: {
          ...prev.split,
          details: newDetails
        }
      };
    });
  };

  // Handle custom split amount change
  const handleSplitAmountChange = (personName: string, value: string) => {
    const amount = parseFloat(value);
    
    setExpenseForm(prev => {
      const newDetails = [...prev.split.details];
      const index = newDetails.findIndex(d => d.personName === personName);
      
      if (index !== -1 && !isNaN(amount)) {
        if (prev.split.type === 'custom') {
          newDetails[index] = {
            ...newDetails[index],
            amount
          };
        } else if (prev.split.type === 'percentage') {
          newDetails[index] = {
            ...newDetails[index],
            percentage: amount
          };
        }
      }
      
      return {
        ...prev,
        split: {
          ...prev.split,
          details: newDetails
        }
      };
    });
  };

  // Component to display split options
  const SplitOptions = () => {
    const totalAmount = parseFloat(expenseForm.amount);
    const includedPeople = expenseForm.split.details.filter(detail => detail.included !== false);
    
    // Calculate totals for validation
    let totalAmountAllocated = 0;
    let totalPercentageAllocated = 0;
    
    if (expenseForm.split.type === 'custom') {
      totalAmountAllocated = expenseForm.split.details.reduce((sum, detail) => 
        sum + (detail.amount || 0), 0);
    } else if (expenseForm.split.type === 'percentage') {
      totalPercentageAllocated = expenseForm.split.details.reduce((sum, detail) => 
        sum + (detail.percentage || 0), 0);
    }
    
    // Determine if inputs are valid
    const isValid = expenseForm.split.type === 'equal' ||
      (expenseForm.split.type === 'custom' && 
       Math.abs(totalAmountAllocated - totalAmount) < 0.01) ||
      (expenseForm.split.type === 'percentage' && 
       Math.abs(totalPercentageAllocated - 100) < 0.01);
    
    return (
      <Box sx={{ mt: 3 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend" sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SplitscreenIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Split Options
              </Typography>
              <Tooltip title="Choose how to split this expense among participants">
                <InfoIcon sx={{ ml: 1, fontSize: '0.9rem', color: 'text.secondary' }} />
              </Tooltip>
            </Box>
          </FormLabel>
          
          <RadioGroup 
            row
            name="splitType" 
            value={expenseForm.split.type} 
            onChange={handleSplitTypeChange}
            sx={{ mb: 2 }}
          >
            <FormControlLabel value="equal" control={<Radio />} label="Equal" />
            <FormControlLabel value="custom" control={<Radio />} label="Custom Amount" />
            <FormControlLabel value="percentage" control={<Radio />} label="Percentage" />
          </RadioGroup>
        </FormControl>
        
        {/* People selection for splitting */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Select who will share this expense
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {expensesData && expensesData.people && expensesData.people.map((person) => {
              const personDetail = expenseForm.split.details.find(d => d.personName === person.name);
              const included = personDetail?.included !== false;
              
              return (
                <Chip
                  key={person.id}
                  label={person.name}
                  onClick={() => handlePersonIncluded(person.name, !included)}
                  color={included ? "primary" : "default"}
                  variant={included ? "filled" : "outlined"}
                  sx={{ fontWeight: 500 }}
                />
              );
            })}
          </Box>
        </Box>
        
        {/* Show custom split inputs if not equal split */}
        {expenseForm.split.type !== 'equal' && includedPeople.length > 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {expenseForm.split.type === 'custom' ? 'Specify amounts' : 'Specify percentages'}
              {!isValid && (
                <Typography 
                  component="span" 
                  color="error.main" 
                  sx={{ ml: 1, fontWeight: 500 }}
                >
                  {expenseForm.split.type === 'custom' 
                    ? `(Total: ${totalAmountAllocated.toFixed(2)} / ${totalAmount})` 
                    : `(Total: ${totalPercentageAllocated.toFixed(2)}% / 100%)`}
                </Typography>
              )}
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2,
              maxHeight: '200px',
              overflowY: 'auto',
              pr: 1
            }}>
              {expenseForm.split.details
                .filter(detail => detail.included !== false)
                .map((detail, index) => (
                  <Box key={detail.personName} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ minWidth: 100 }}>{detail.personName}</Typography>
                    <TextField
                      size="small"
                      type="number"
                      value={expenseForm.split.type === 'custom' 
                        ? detail.amount || ''
                        : detail.percentage || ''}
                      onChange={(e) => handleSplitAmountChange(detail.personName, e.target.value)}
                      InputProps={{
                        startAdornment: expenseForm.split.type === 'custom' ? (
                          <InputAdornment position="start">QAR</InputAdornment>
                        ) : (
                          <InputAdornment position="start">%</InputAdornment>
                        ),
                      }}
                      fullWidth
                    />
                  </Box>
                ))}
            </Box>
          </Box>
        )}
      </Box>
    );
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

  // Enhance ListItemText to show split information
  const renderExpenseDetails = (expense: Expense) => {
    // Format the split info if available
    let splitInfo = "";
    
    if (expense.split) {
      if (expense.split.type === 'equal') {
        const includedCount = expense.split.details?.length || expensesData.people.length;
        splitInfo = `Split equally (${includedCount} people)`;
      } else if (expense.split.type === 'custom' && expense.split.details) {
        const peopleCount = expense.split.details.length;
        splitInfo = `Custom split (${peopleCount} people)`;
      } else if (expense.split.type === 'percentage' && expense.split.details) {
        const peopleCount = expense.split.details.length;
        splitInfo = `Percentage split (${peopleCount} people)`;
      }
    }
    
    return (
      <>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {expense.description}
        </Typography>
        <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" color="text.secondary" component="span">
            {expense.date} • {expense.category}
          </Typography>
          
          {splitInfo && (
            <Typography variant="body2" color="primary.light" component="span" sx={{ mt: 0.5 }}>
              {splitInfo}
            </Typography>
          )}
          
          {expense.paidBy !== expensesData.people[currentTab]?.name && (
            <Typography variant="body2" color="primary" component="span" sx={{ mt: 0.5 }}>
              • Paid by {expense.paidBy}
            </Typography>
          )}
        </Box>
      </>
    );
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
                    QAR {expensesData && expensesData.people && Array.isArray(expensesData.people) ? 
                      expensesData.people.reduce(
                        (total, person) => {
                          if (!person || !person.expenses || !Array.isArray(person.expenses)) {
                            return total;
                          }
                          return total + person.expenses.reduce((sum, expense) => sum + expense.amount, 0);
                        }, 
                        0
                      ).toFixed(2) : '0.00'}
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
                    Per Person (Equal Split)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    QAR {calculateAveragePerPerson().toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>
              Individual Expenditures
            </Typography>
            
            <Box sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              p: 2, 
              mb: 3
            }}>
              {expensesData && expensesData.people && Array.isArray(expensesData.people) && expensesData.people.map(person => {
                const spent = calculatePersonPaid(person.name);
                const shouldPay = calculateAveragePerPerson();
                const difference = spent - shouldPay;
                
                return (
                  <Box 
                    key={person.id}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                      '&:last-child': {
                        borderBottom: 'none'
                      }
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {person.name}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Paid: QAR {spent.toFixed(2)}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          color: difference > 0 
                            ? 'success.main' 
                            : difference < 0 
                              ? 'error.main' 
                              : 'text.secondary'
                        }}
                      >
                        {difference > 0 
                          ? `Gets back QAR ${difference.toFixed(2)}` 
                          : difference < 0 
                            ? `Owes QAR ${Math.abs(difference).toFixed(2)}` 
                            : `Settled`}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
            
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Settlement Plan
            </Typography>
            
            <Box sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              p: 2
            }}>
              {calculateDetailedBalances().length === 0 ? (
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', textAlign: 'center' }}>
                  All balances are settled
                </Typography>
              ) : (
                <>
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    To settle all debts, make the following payments:
                  </Typography>
                  {calculateDetailedBalances().map((transfer, index) => (
                    <Box 
                      key={index}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        mb: index < calculateDetailedBalances().length - 1 ? 2 : 0
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: 'primary.main',
                          mr: 1 
                        }} 
                      />
                      <Typography variant="body1">
                        <strong>{transfer.from}</strong> pays <strong>QAR {transfer.amount.toFixed(2)}</strong> to <strong>{transfer.to}</strong>
                      </Typography>
                    </Box>
                  ))}
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(51, 102, 255, 0.1)', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <InfoIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                      This is the simplest way to settle all debts with the minimum number of transactions.
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
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
      
      {/* Tabs for people */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Paper sx={{ borderRadius: 2, boxShadow: 'none', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
          <Tabs 
            value={currentTab} 
            onChange={(_, newValue) => setCurrentTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: 'primary.main',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: 'primary.main',
                  fontWeight: 600
                }
              }
            }}
          >
            {expensesData && expensesData.people && Array.isArray(expensesData.people) && expensesData.people.map((person, index) => (
              <Tab key={person.id} label={person.name} />
            ))}
          </Tabs>
        </Paper>
      </Box>
      
      {/* Person's expenses */}
      {expensesData && expensesData.people && Array.isArray(expensesData.people) && expensesData.people.length > 0 && (
        <Box sx={{ px: 2, mb: 4 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {expensesData.people[currentTab]?.name}'s Expenses
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  QAR {calculatePersonTotal(expensesData.people[currentTab]?.id || 0).toFixed(2)}
                </Typography>
              </Box>
              
              {!expensesData.people[currentTab] || !expensesData.people[currentTab].expenses || expensesData.people[currentTab].expenses.length === 0 ? (
                <Box sx={{ 
                  p: 3, 
                  textAlign: 'center', 
                  bgcolor: 'rgba(0, 0, 0, 0.02)', 
                  borderRadius: 2,
                  mt: 2
                }}>
                  <Typography variant="body1" color="text.secondary">
                    No expenses added yet.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Click the + button to add an expense.
                  </Typography>
                </Box>
              ) : (
                <List sx={{ 
                  mt: 1,
                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}>
                  {expensesData.people[currentTab]?.expenses
                    .sort((a, b) => {
                      // Use timestamp if available, fall back to date
                      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.date).getTime();
                      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.date).getTime();
                      return timeB - timeA; // Most recent first
                    })
                    .map((expense, index) => (
                      <React.Fragment key={expense.id}>
                        <ListItem
                          sx={{ 
                            py: 2,
                            px: 2,
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.03)'
                            }
                          }}
                          secondaryAction={
                            <IconButton 
                              edge="end" 
                              aria-label="delete"
                              onClick={() => handleDeleteExpense(expensesData.people[currentTab]?.id || 0, expense.id)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          }
                          onClick={() => handleOpenEditExpenseDialog(expensesData.people[currentTab]?.id || 0, expense.id)}
                        >
                          <Box sx={{ 
                            mr: 2, 
                            width: 40, 
                            height: 40, 
                            borderRadius: '50%', 
                            bgcolor: 'rgba(51, 102, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <ReceiptIcon sx={{ color: 'primary.main' }} />
                          </Box>
                          <ListItemText
                            primary={
                              renderExpenseDetails(expense)
                            }
                          />
                          <Box sx={{ 
                            ml: 2, 
                            textAlign: 'right',
                            minWidth: 80
                          }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                              QAR {expense.amount.toFixed(2)}
                            </Typography>
                          </Box>
                        </ListItem>
                        {index < expensesData.people[currentTab]?.expenses.length - 1 && (
                          <Divider component="li" />
                        )}
                      </React.Fragment>
                    ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
      
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
          if (expensesData && expensesData.people && Array.isArray(expensesData.people) && expensesData.people.length > 0) {
            setSelectedPersonId(expensesData.people[currentTab]?.id);
            setAddExpenseDialogOpen(true);
          } else {
            // Handle the case where there are no people
            alert("Please add people to the expense tracker first.");
          }
        }}
      >
        <AddIcon />
      </Fab>
      
      {/* Add Expense Dialog */}
      <Dialog open={addExpenseDialogOpen} onClose={() => setAddExpenseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Expense</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Description"
              name="description"
              value={expenseForm.description}
              onChange={handleExpenseFormChange}
              placeholder="e.g. Dinner at Restaurant"
            />
            <TextField
              fullWidth
              margin="normal"
              label="Amount (QAR)"
              name="amount"
              type="number"
              value={expenseForm.amount}
              onChange={handleExpenseFormChange}
              placeholder="0.00"
              InputProps={{
                startAdornment: <InputAdornment position="start">QAR</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Date"
              name="date"
              type="date"
              value={expenseForm.date}
              onChange={handleExpenseFormChange}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={expenseForm.category}
                onChange={handleExpenseFormChange}
                label="Category"
              >
                {expenseCategories.map(category => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Paid By</InputLabel>
              <Select
                name="paidBy"
                value={expenseForm.paidBy}
                onChange={handleExpenseFormChange}
                label="Paid By"
              >
                <MenuItem value="">
                  <em>{(expensesData && expensesData.people && Array.isArray(expensesData.people) && expensesData.people.find(p => p.id === selectedPersonId)?.name) || 'Self'}</em>
                </MenuItem>
                {expensesData && expensesData.people && Array.isArray(expensesData.people) && expensesData.people.map(person => (
                  <MenuItem key={person.id} value={person.name}>{person.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Add split options */}
            <Divider sx={{ my: 1 }} />
            <SplitOptions />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddExpenseDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddExpense} 
            variant="contained" 
            color="primary"
            disabled={!expenseForm.description || !expenseForm.amount}
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
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="paid-by-label-edit">Paid By</InputLabel>
            <Select
              labelId="paid-by-label-edit"
              name="paidBy"
              value={expenseForm.paidBy}
              label="Paid By"
              onChange={handleExpenseFormChange}
            >
              {expensesData && expensesData.people && Array.isArray(expensesData.people) && expensesData.people.map(person => (
                <MenuItem key={person.id} value={person.name}>{person.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Add split options to edit dialog */}
          <Divider sx={{ my: 1 }} />
          <SplitOptions />
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