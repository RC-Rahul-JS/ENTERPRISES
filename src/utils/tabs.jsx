import Cookies from 'js-cookie';

export const setting_tabs = [
    { label: 'FEES', route: 'fees' },
    { label: 'DATE', route: 'date' },
    { label: 'SLOTS', route: 'slots' },
    { label: 'AVAILABLE', route: 'av' },
  ];
export const ledger_tabs = [
    { label: 'VIEW LEDGER', route: '' },
    { label: 'VOUCHERS', route: 'vouchers' },
    { label: 'CREATE LEDGER', route: 'create_ledger' },
    { label: 'CREATE SUBGROUP', route: 'create_subgroup' },
    { label: 'CREATE GROUP', route: 'create_group' },
    { label: 'JOURNAL VOUCHER', route: 'journal_voucher1' },
    { label: 'PAYMENT VOUCHER', route: 'payment_voucher1' },
    { label: 'RECEIPT VOUCHER', route: 'reciept_voucher' },
  ];
export const staff_tabs = [
    { label: 'Share Holders', route: '' },
    { label: 'DESIGNATION', route: 'designation' },
    { label: 'ASSIGN PERSONAL LEDGER', route: 'assignpersonalledger' },
    { label: 'ATTANDENCE', route: 'attandence' }
  ];
export const report_tabs = Cookies.get('logintype')!=='ca' ? [
    { label: 'TRIAL BALANCE', route: '' },
    { label: 'TRIAL BALANCE_2', route: 'trial_balance_2' },
    { label: 'FINANCIAL', route: 'financial_report' },
    // { label: 'TRADING A/c', route: 'trading_ac_v3' },
    { label: 'TRADING A/c V2', route: 'trading_account' },
    { label: 'STATEMENTS', route: 'personal_statement' },
    { label: 'GST SUBLEDGER', route: 'gst_subledger' },
    { label: 'RCM', route: 'rcm' },
  ]:[{ label: 'GST REPORT', route: 'c2c_gst' }, { label: 'RCM', route: 'rcm' }]
  
export const payments_tabs = [
    // { label: 'PAYMENT RECIEVED', route: '' },
    // { label: 'PAY DOCTOR', route: 'payment_voucher' },
    { label: 'BULK PAYMENT', route: 'payment_voucher_multiple' },
    { label: 'STATEMENT', route: 'doctor_ledger' },
    { label: 'Excel Uploader', route: 'excel_uploader' },
    { label: 'PAYMENT REQUEST', route: 'payment_req' },
  ];

export const trade_tabs = [
    // { label: 'PAYMENT RECIEVED', route: '' },
    // { label: 'PAY DOCTOR', route: 'payment_voucher' },
    { label: 'ADD PRODUCT', route: '' },
    { label: 'CATEGORIES', route: 'categories' },
    { label: 'CUSTOMERS', route: 'add_customer' },
    { label: 'VENDORS', route: 'add_vendor' },
    { label: 'CREATE BILL', route: 'create_bill' },
    { label: 'RETURN BILL', route: 'return_bill' },
    { label: 'EXPENSE BOOKING', route: 'expense' },
    { label: 'EXPENSE LIST', route: 'expenselist' },
    { label: 'INVENTORY', route: 'inventory' },

  ];