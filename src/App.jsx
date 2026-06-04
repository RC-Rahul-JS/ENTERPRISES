
// src/App.jsx
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout/Layout';
import Register from './pages/Register';
import Login from './pages/Login';
import Tabs_layout from './Layout/Tabs_layout';
import {ledger_tabs, payments_tabs, report_tabs, setting_tabs, staff_tabs, trade_tabs } from './utils/tabs';
import Payments from './pages/Payments/Payments';
import Reports from './pages/Reports/Reports';
import Designation from './pages/Designation/Designation';
import EmpCreate from './pages/EmployeeCreate/EmpCreate';
import SetPassword from './pages/EmployeeCreate/ResetPass';
import JournalVoucher from './pages/EmployeeCreate/Jornal';
import Dashboard from './pages/Dashboard';
import View_ledger from './pages/Accounting/View_ledger';
import Create_group from './pages/Accounting/Create_group';
import Create_subgroup from './pages/Accounting/Create_subgroup';
import Create_ledger from './pages/Accounting/Create_ledger';
import Vouchers from './pages/Payments/Vouchers';
import DoctorLedgerPage from './pages/Payments/DoctorLedgerPage';
import LedgerStatementPage from './pages/Payments/LedgerStatementPage';
import PaymentVoucherPage from './pages/Payments/PaymentVoucherPage';
import AppointmentPage from './pages/Payments/try';
import PaymentMultiple from './pages/Payments/PaymentMultiple';
import ExcelUploader from './pages/Payments/ExcelUploader';
import BankDetails from './pages/setting/BankDetails';
import PaymentReq from './pages/Payments/PaymentReq';
import PaymentVoucher from './pages/Accounting/PaymentVoucher';
import JournalVoucher1 from './pages/Accounting/JournalVoucher';
import RecieptVoucher from './pages/Accounting/RecieptVoucher';
import TrialBalance from './pages/Reports/TrialBalance';
import ProfitLossStatement from './pages/Reports/Profit&Loss';
import PersonalVoucher from './pages/Payments/PersonalVoucher';
import AddProduct from './pages/Trade/AddProduct';
import Billing from './pages/Trade/Billing';
import ReturnBill from './pages/Trade/ReturnBill';
import AddCustomer from './pages/Trade/AddCustomer';
import AddVendor from './pages/Trade/AddVendor';
import ExpenseBooking from './pages/Trade/Expense_Booking';
import GstSubledger from './pages/Reports/GstSubledger';
import C2cGst from './pages/Reports/C2cGst';
import Expense_List from './pages/Trade/Expense_List';
import ExpenseProduct from './pages/Trade/ExpenseProduct';
import File from './pages/file';
import RCM from './pages/Reports/RCM';
import Attandence from './pages/EmployeeCreate/Attandence';
import AssignPersonalLedger from './pages/Trade/AssignPersonalLedger';
import CategoryModule from './pages/Trade/Categories'
import TradingStatement from './pages/Reports/TradingAccount';
import Inventory from './pages/Trade/Inventory';
import TrialBalance2 from './pages/Reports/TrialBalance2';
// import Trading_Ac_V3 from './pages/Reports/Trading_Ac_old';

function App() {
  return (
    <Router>
        <Routes>
          <Route path="/login" element={<Login />} /> 
          <Route path="/" element={<Layout/>} >
            <Route path="/settings/:id" element={<Tabs_layout tabs={setting_tabs} />} >
                <Route path="bank" element={<BankDetails/>} />
                <Route path="" element={<BankDetails/>} />
            </Route>
            <Route path="/accounting/" element={<Tabs_layout tabs={ledger_tabs} />} >
                {/* <Route path="" element={<View_ledger/>} /> */}
                <Route path="" element={<LedgerStatementPage />} />
                <Route path="vouchers" element={<Vouchers/>} />
                <Route path="create_group" element={<Create_group/>} />
                <Route path="create_subgroup" element={<Create_subgroup/>} />
                <Route path="create_ledger" element={<Create_ledger/>} />
                <Route path="payment_voucher1" element={<PaymentVoucher/>} />
                <Route path="journal_voucher1" element={<JournalVoucher1/>} />
                <Route path="reciept_voucher" element={<RecieptVoucher/>} />
            </Route>
            <Route path="/staff/" element={<Tabs_layout tabs={staff_tabs} />} >
                <Route path="" element={<EmpCreate/>} />
                <Route path="designation" element={<Designation/>} />
                <Route path="assignpersonalledger" element={<AssignPersonalLedger/>} />
                <Route path="attandence" element={<Attandence/>} />
            </Route>
            <Route path="/payments/" element={<Tabs_layout tabs={payments_tabs} />} >
                {/* <Route path="" element={<Payments />} /> */}
                <Route path="" element={<PaymentMultiple />} />
                <Route path="doctor_ledger" element={<DoctorLedgerPage />} />
                <Route path="payment_voucher" element={<PaymentVoucherPage />} />
                <Route path="payment_voucher_multiple" element={<PaymentMultiple />} />
                <Route path="excel_uploader" element={<ExcelUploader />} />
                <Route path="payment_req" element={<PaymentReq />} />
            </Route>
          {/* <Route path="/Reports" element={<Reports />} /> */}
             <Route path="/reports/" element={<Tabs_layout tabs={report_tabs} />} >
                <Route path="" element={<TrialBalance/>} />
                <Route path="financial_report" element={<ProfitLossStatement/>} />
                <Route path="personal_statement" element={<PersonalVoucher/>} />
                <Route path="trading_account" element={<TradingStatement/>} />
                <Route path="trial_balance_2" element={<TrialBalance2/>} />
                {/* <Route path="trading_ac_v3" element={<Trading_Ac_V3/>} /> */}
                <Route path="gst_subledger" element={<GstSubledger/>} />
                <Route path="c2c_gst" element={<C2cGst/>} />
                <Route path="rcm" element={<RCM/>} />
                {/* <Route path="test" element={<File/>} /> */}
            </Route>

             <Route path="/trade/" element={<Tabs_layout tabs={trade_tabs} />} >
                <Route path="" element={<AddProduct/>} />
                <Route path="create_bill" element={<Billing/>} />
                <Route path="return_bill" element={<ReturnBill/>} />
                <Route path="add_customer" element={<AddCustomer/>} />
                <Route path="add_vendor" element={<AddVendor/>} />
                <Route path="expense" element={<ExpenseBooking/>} />
                <Route path="expenselist" element={<Expense_List/>} />
                <Route path="categories" element={<CategoryModule/>} />
                <Route path="inventory" element={<Inventory/>} />
            </Route>

          <Route path="/register" element={<Register />} />
          <Route path="" element={<Dashboard/>} />
          <Route path="/setpassword" element={<SetPassword />} />
          <Route path="/journal_voucher" element={<JournalVoucher />} />
          <Route path="/try" element={<AppointmentPage />} />
          <Route path="*" element={<p className='text-orange-400 text-1xl'>Work In Progess...</p>} />
          </Route>
        </Routes>
    </Router>
  );
}

export default App;
