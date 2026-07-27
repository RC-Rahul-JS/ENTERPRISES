import React, { useState, useEffect } from 'react';
import UploadFile from '../Components/UploadFile';
import moment from 'moment';
import axios from 'axios';
import { useLoader } from '../../context/LoaderContext';
import Swal from 'sweetalert2';
import statejosn from './statedistrict.json';

const toast = {
  success: (msg) => {
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: msg,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  },
  error: (msg) => {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: msg,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  },
};

const MemberApplicationForm = () => {
  useEffect(() => {
    if (statejosn && statejosn[2]) {
      console.log(statejosn[2].districts);
    }
  }, []);

  const [tab, settab] = useState(1);
  const [OtpShow, setOtpShow] = useState(false);
  const [loader, setloader] = useState(false);
  
  const loaderCtx = useLoader();
  const showLoader = loaderCtx?.showLoader || (() => {});
  const hideLoader = loaderCtx?.hideLoader || (() => {});

  const initialFormData = {
    branchname: '',
    branch: '',
    aadhartxn: '',
    title: '',
    firstname: '',
    lastname: '',
    fathername: '',
    dob: '',
    age: '',
    gender: '',
    category: '',
    mobile: '',
    email: '',
    occupation: '',
    officeaddress: '',
    income: '',
    aadharnumber: '',
    paddress: '',
    city: '',
    state: 'Madhya Pradesh',
    district: '',
    pincode: '',
    sameaddress: false,
    caddress: '',
    ccity: '',
    cstate: 'Madhya Pradesh',
    cdistrict: '',
    cpincode: '',
    introducerid: localStorage.getItem('MID') || '',
    introducername: '',
    peroidknown: '',
    nomineetitle: '',
    nomineename: '',
    nomineerelation: '',
    nomineedob: '',
    nomineeage: '',
    nomineeaddress: '',
    gurdiantitle: '',
    gurdianname: '',
    gurdianrelation: '',
    gurdiandob: '',
    gurdianage: '',
    idproof: '',
    idproofnumber: '',
    addressproof: '',
    addressproofnumber: '',
    photo: '',
    idfront: '',
    idback: '',
    addfront: '',
    addback: '',
  };

  const [formdata, setformdata] = useState(initialFormData);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'sameAsPermanent' && checked) {
        setformdata((prev) => ({
          ...prev,
          sameaddress: !prev.sameaddress,
          caddress: prev.paddress,
          ccity: prev.city,
          cstate: prev.state,
          cdistrict: prev.district,
          cpincode: prev.pincode,
        }));
      } else {
        setformdata((prev) => ({
          ...prev,
          sameaddress: false,
          caddress: '',
          ccity: '',
          cstate: 'Madhya Pradesh',
          cdistrict: '',
          cpincode: '',
        }));
      }
    }
  };

  const aadharverification = async () => {
    if (formdata.aadharnumber.length !== 12) {
      toast.error('Invalid Aadhaar Number');
      return;
    }

    showLoader();

    try {
      const aadharOtpBase = import.meta.env.VITE_AADHAR_OTP_URL || 'https://apipoultry.duniyape.in/api/aadhar';
      const res = await axios.post(`${aadharOtpBase}/send-otp`, {
        uid: formdata.aadharnumber,
      });

      console.log(res.data);

      const transactionId = res.data?.data?.sessionId;
      setformdata({ ...formdata, aadhartxn: transactionId });
      setOtpShow(true);

      toast.success(res.data?.data?.message || 'OTP sent successfully');
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Server Error');
    } finally {
      hideLoader();
    }
  };

  const [Otp, setOtp] = useState('');

  const aadharOTPsent = async () => {
    if (!formdata.aadhartxn || Otp.length !== 6) {
      toast.error('Invalid OTP');
      return;
    }

    showLoader();

    try {
      const aadharOtpBase = import.meta.env.VITE_AADHAR_OTP_URL || 'https://apipoultry.duniyape.in/api/aadhar';
      const res = await axios.post(`${aadharOtpBase}/verify-otp`, {
        otp: Otp,
        sessionId: formdata.aadhartxn,
      });

      const data = res.data;
      console.log(data);

      if (data?.success === false) {
        toast.error(data.message || 'OTP verification failed');
        return;
      }

      setaadhardata(data?.data);
      setOtpShow(false);
      toast.success('Aadhaar verified successfully');
    } catch (error) {
      console.error(error);

      if (error.response) {
        toast.error(error.response.data?.message || 'API Error');
      } else if (error.request) {
        toast.error('Server not reachable');
      } else {
        toast.error('Something went wrong');
      }
    } finally {
      hideLoader();
    }
  };

  const [aadhardata, setaadhardata] = useState(null);

  useEffect(() => {
    console.log(aadhardata);

    if (aadhardata) {
      setformdata({
        ...formdata,
        fathername: aadhardata.careof,
        firstname: (aadhardata.name || '').split(' ')[0],
        lastname: (aadhardata.name || '').split(' ').pop(),
        pincode: aadhardata.pincode,
        state: aadhardata.state,
        district: aadhardata.district,
        dob: moment(aadhardata.dob, 'DD-MM-YYYY').format('YYYY-MM-DD'),
        sameaddress: true,
        gender: aadhardata.gender === 'M' ? 'Male' : aadhardata.gender === 'F' ? 'Female' : 'Other',
        city: aadhardata.district,
        paddress: `${aadhardata.house}, ${aadhardata.landmark}, ${aadhardata.street}, ${aadhardata.locality}, ${aadhardata.district}, ${aadhardata.state}.`,
        cpincode: aadhardata.pincode,
        cstate: aadhardata.state,
        cdistrict: aadhardata.district,
        ccity: aadhardata.district,
        caddress: `${aadhardata.house}, ${aadhardata.landmark}, ${aadhardata.street}, ${aadhardata.locality}, ${aadhardata.district}, ${aadhardata.state}.`,
      });
    }
  }, [aadhardata]);

  const create = async (e) => {
    e.preventDefault();
    console.log('create started', formdata);
    showLoader();

    const formDataPayload = new FormData();

    // Personal & Address Text Fields
    formDataPayload.append('Aadhar', formdata.aadharnumber || '');
    formDataPayload.append('BranchName', formdata.branchname || '');
    formDataPayload.append('BranchCode', formdata.branch || '');
    formDataPayload.append('ReceiptDate', moment(new Date()).format('yyyy-MM-DD'));
    formDataPayload.append('MemberCategory', 'Ordinary');
    formDataPayload.append('Title', formdata.title || '');
    formDataPayload.append('FirstName', formdata.firstname || '');
    formDataPayload.append('LastName', formdata.lastname || '');
    formDataPayload.append('RelationOf', 'xx');
    formDataPayload.append('FatherName', formdata.fathername || '');
    formDataPayload.append('DateOfBirth', formdata.dob || '');
    formDataPayload.append('Age', formdata.age || '');
    formDataPayload.append('Gender', formdata.gender || '');
    formDataPayload.append('Category', formdata.category || '');
    formDataPayload.append('MobileNo', formdata.mobile || '');
    formDataPayload.append('Email', formdata.email || '');
    formDataPayload.append('Occupation', formdata.occupation || '');
    formDataPayload.append('OfficialAdd', formdata.officeaddress || '');
    formDataPayload.append('MonthlyIncome', formdata.income || '');

    // Second Page
    formDataPayload.append('PermanentAdd', formdata.paddress || '');
    formDataPayload.append('City', formdata.city || '');
    formDataPayload.append('District', formdata.district || '');
    formDataPayload.append('State', formdata.state || '');
    formDataPayload.append('PinCode', formdata.pincode || '');
    formDataPayload.append('SameAddress', formdata.sameaddress ? 'true' : 'false');
    formDataPayload.append('ResidenceAdd', formdata.caddress || '');
    formDataPayload.append('RCity', formdata.ccity || '');
    formDataPayload.append('RDistrict', formdata.cdistrict || '');
    formDataPayload.append('Rstate', formdata.cstate || '');
    formDataPayload.append('RPinCode', formdata.cpincode || '');

    formDataPayload.append('MemberId', formdata.introducerid || '');
    formDataPayload.append('MemberName', formdata.introducername || '');
    formDataPayload.append('Duration', formdata.peroidknown || '');

    // Third Page
    formDataPayload.append('NomTitle', formdata.nomineetitle || '');
    formDataPayload.append('NomName', formdata.nomineename || '');
    formDataPayload.append('NomRelation', formdata.nomineerelation || '');
    formDataPayload.append('NomAge', formdata.nomineeage || '');
    formDataPayload.append('NomDOB', formdata.nomineedob || '');
    formDataPayload.append('NomAddress', formdata.nomineeaddress || '');

    formDataPayload.append('GurName', formdata.gurdianname || '');
    formDataPayload.append('GurRelationship', formdata.gurdianrelation || '');
    formDataPayload.append('GurAge', formdata.gurdianage || '');

    formDataPayload.append('KycIdproof', formdata.idproof || '');
    formDataPayload.append('KycOther', 'xx');
    formDataPayload.append('KycDocNo', formdata.idproofnumber || '');
    formDataPayload.append('KycAddProof', formdata.addressproof || '');
    formDataPayload.append('KycTother', 'xx');
    formDataPayload.append('KycTdocNo', formdata.addressproofnumber || '');
    formDataPayload.append('EmpID', 'xx');
    formDataPayload.append('Status', 'Active');

    // Image Uploads (Multipart Files)
    if (formdata.photo) {
      formDataPayload.append('photo', formdata.photo);
      formDataPayload.append('UploadPhoto', formdata.photo);
    }
    if (formdata.idfront) {
      formDataPayload.append('idfront', formdata.idfront);
      formDataPayload.append('UploadId', formdata.idfront);
    }
    if (formdata.idback) {
      formDataPayload.append('idback', formdata.idback);
      formDataPayload.append('UploadId2', formdata.idback);
    }
    if (formdata.addfront) {
      formDataPayload.append('addfront', formdata.addfront);
      formDataPayload.append('UploadAddress', formdata.addfront);
    }
    if (formdata.addback) {
      formDataPayload.append('addback', formdata.addback);
      formDataPayload.append('UploadAddress2', formdata.addback);
    }

    console.log('--- Multipart FormData Payload Entries ---');
    for (let pair of formDataPayload.entries()) {
      console.log(pair[0] + ':', pair[1]);
    }

    const localprimeBase = import.meta.env.VITE_LOCALPRIME_URL || 'http://192.168.29.145:5000/badri_enterprises/localprime';
    const api = `${localprimeBase}/create-member-request`;

    try {
      const res = await axios.post(api, formDataPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Create Member Request API Success Response:', res.data);
      toast.success(res.data?.message || 'Member Request Submitted! Pending admin approval.');
      setformdata({
        ...initialFormData,
        introducername: formdata.introducername,
        branch: formdata.branch,
        branchname: formdata.branchname,
      });
      settab(1);
    } catch (error) {
      console.error('Error creating member request:', error);
      toast.error(error?.response?.data?.message || 'Failed to submit member request');
    } finally {
      hideLoader();
    }
  };

  const getformdata = async (targetMid) => {
    const mid = targetMid || formdata.introducerid;
    if (!mid || mid.trim().length < 4) return;
    showLoader();
    const localprimeBase = import.meta.env.VITE_LOCALPRIME_URL || 'http://192.168.29.145:5000/badri_enterprises/localprime';
    const api = `${localprimeBase}/members?memberId=${mid.trim()}`;
    try {
      const res = await axios.get(api);
      console.log('Fetched Member Data:', res.data);
      if (res.data) {
        const rawPayload = res.data.data ? res.data.data : res.data;
        const data = Array.isArray(rawPayload) ? rawPayload[0] : rawPayload;

        const firstName = data.FirstName || data.firstname || data.first_name || '';
        const lastName = data.LastName || data.lastname || data.last_name || '';

        let name = data.MemberName || data.memberName || data.name || data.Name || '';
        if (!name && (firstName || lastName)) {
          name = `${firstName} ${lastName}`.trim();
        }

        const branchCode = data.BranchCode || data.branchCode || '001';
        const branchName = data.BranchName || data.branchName || '';

        setformdata((prev) => ({
          ...prev,
          introducername: name,
          branch: branchCode,
          branchname: branchName,
        }));
      } else {
        setformdata((prev) => ({ ...prev, introducername: '' }));
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.warn(`Member ID "${mid}" not found.`);
        setformdata((prev) => ({ ...prev, introducername: '' }));
      } else {
        console.error('Error fetching member data:', error);
      }
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    const cleanId = (formdata.introducerid || '').trim();
    if (cleanId.length >= 7) {
      const timer = setTimeout(() => {
        getformdata(cleanId);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formdata.introducerid]);

  const handleNext = (e) => {
    e.preventDefault();
    console.log('Proceed to next step:');
    settab((prev) => prev + 1);
  };
  const handlePrevious = () => {
    console.log('Proceed to previous step:');
    settab((prev) => prev - 1);
  };

  const handleTabChange = (targetTabIndex) => {
    if (targetTabIndex <= tab) {
      settab(targetTabIndex);
    }
  };

  function calculateAge(dob) {
    if (!dob) return '';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : 0;
  }

  useEffect(() => {
    if (formdata.dob) {
      setformdata((prev) => ({ ...prev, age: `${calculateAge(prev.dob)}` }));
    }
  }, [formdata.dob]);

  useEffect(() => {
    if (formdata.nomineedob) {
      setformdata((prev) => ({ ...prev, nomineeage: `${calculateAge(prev.nomineedob)}` }));
    }
  }, [formdata.nomineedob]);

  useEffect(() => {
    if (formdata.gurdiandob) {
      setformdata((prev) => ({ ...prev, gurdianage: `${calculateAge(prev.gurdiandob)}` }));
    }
  }, [formdata.gurdiandob]);

  useEffect(() => {
    getformdata();
  }, []);

  return (
    <div style={container}>
      <h2 style={{ textAlign: 'center', color: '#b4a383', fontSize: '18px', marginBottom: '20px', position: 'relative' }}>
        <i
          className="fa-solid fa-arrow-left"
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            fontSize: '20px',
            color: '#b4a383',
            marginLeft: '10px',
          }}
          onClick={() => window.history.back()}
        ></i>
        Member Application
      </h2>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Step 1 */}
        <button
          type="button"
          onClick={() => handleTabChange(1)}
          style={{
            width: 50,
            height: 50,
            backgroundColor: tab >= 1 ? '#B1FFBF' : '#F0F0F0',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${tab >= 1 ? '#2D7809' : '#BABABA'}`,
            cursor: 'pointer',
          }}
        >
          <i className={`fa-solid fa-user`} style={{ color: tab >= 1 ? '#2D7809' : '#BABABA', fontSize: 18 }} />
        </button>

        <div style={{ width: 34, height: 2, backgroundColor: tab > 1 ? '#2D7809' : '#F0F0F0' }}></div>

        {/* Step 2 */}
        <button
          type="button"
          onClick={() => handleTabChange(2)}
          style={{
            width: 50,
            height: 50,
            backgroundColor: tab > 1 ? '#B1FFBF' : '#F0F0F0',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${tab > 1 ? '#2D7809' : '#BABABA'}`,
            cursor: 'pointer',
          }}
        >
          <i className="fa-solid fa-location-dot" style={{ color: tab > 1 ? '#2D7809' : '#BABABA', fontSize: 18 }} />
        </button>

        <div style={{ width: 37, height: 2, backgroundColor: tab > 2 ? '#2D7809' : '#F0F0F0' }}></div>

        {/* Step 3 */}
        <button
          type="button"
          onClick={() => handleTabChange(3)}
          style={{
            width: 50,
            height: 50,
            backgroundColor: tab > 2 ? '#B1FFBF' : '#F0F0F0',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${tab > 2 ? '#2D7809' : '#BABABA'}`,
            cursor: 'pointer',
          }}
        >
          <i className="fa-solid fa-users" style={{ color: tab > 2 ? '#2D7809' : '#BABABA', fontSize: 18 }} />
        </button>

        <div style={{ width: 25, height: 2, backgroundColor: tab > 3 ? '#2D7809' : '#F0F0F0' }}></div>

        {/* Step 4 */}
        <button
          type="button"
          onClick={() => handleTabChange(4)}
          style={{
            width: 50,
            height: 50,
            backgroundColor: tab > 3 ? '#B1FFBF' : '#F0F0F0',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${tab > 3 ? '#2D7809' : '#BABABA'}`,
            cursor: 'pointer',
          }}
        >
          <i className="fa-solid fa-upload" style={{ color: tab > 3 ? '#2D7809' : '#BABABA', fontSize: 18 }} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 5, marginBottom: 20 }}>
        <p style={{ fontSize: 10, width: 75, textAlign: 'center', padding: '0 4px' }}>Personal Details</p>
        <p style={{ fontSize: 10, width: 100, textAlign: 'center', padding: '0 4px' }}>Correspondence Details</p>
        <p style={{ fontSize: 10, width: 75, textAlign: 'center', padding: '0 4px' }}>Nomination Details</p>
        <p style={{ fontSize: 10, width: 75, textAlign: 'center', padding: '0 4px' }}>Upload Documents</p>
      </div>

      {tab === 1 && (
        <form onSubmit={handleNext}>
          {/* Aadhaar Section */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Aadhaar No.</label>
            <input
              required
              value={formdata.aadharnumber}
              onChange={(e) => setformdata({ ...formdata, aadharnumber: e.target.value })}
              type="number"
              placeholder="Enter Aadhaar No."
              style={inputStyle}
            />
          </div>
          <button type="button" onClick={() => aadharverification()} style={buttonStyle}>
            Get OTP
          </button>
          {OtpShow && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>OTP</label>
                <input
                  required
                  value={Otp}
                  onChange={(e) => setOtp(e.target.value)}
                  type="number"
                  placeholder="Enter Here"
                  style={inputStyle}
                />
              </div>
              <button type="button" onClick={() => aadharOTPsent()} style={buttonStyle}>
                Verify
              </button>
            </>
          )}

          {/* Form Fields */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: 16 }}>
            {[
              { label: 'Title', type: 'select', name: 'title', options: ['Mr', 'Mrs', 'Miss'] },
              { label: 'First Name', name: 'firstname' },
              { label: 'Last Name', name: 'lastname' },
              { label: 'Father/Husband Name', name: 'fathername' },
              { label: 'Date of Birth', name: 'dob', type: 'date' },
              { label: 'Age', name: 'age', type: 'number' },
              {
                label: 'Gender',
                type: 'select',
                name: 'gender',
                options: ['Male', 'Female', 'Other'],
              },
              {
                label: 'Category',
                type: 'select',
                name: 'category',
                options: ['General', 'OBC', 'SC', 'ST'],
              },
              { label: 'Mobile', name: 'mobile', type: 'tel' },
              { label: 'Email', name: 'email', type: 'email' },
              { label: 'Occupation', name: 'occupation' },
              { label: 'Monthly Income', name: 'income', type: 'number' },
            ].map((field, idx) => (
              <div key={idx} style={formItem}>
                <label style={labelStyle}>{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    required
                    value={formdata[field.name]}
                    onChange={(e) => setformdata({ ...formdata, [field.name]: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">Select</option>
                    {field.options.map((opt, i) => (
                      <option key={i}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    disabled={field.name === 'age'}
                    value={formdata[field.name]}
                    onChange={(e) => setformdata({ ...formdata, [field.name]: e.target.value })}
                    type={field.type || 'text'}
                    style={inputStyle}
                    pattern={field.type === 'tel' ? '[6-9]{1}[0-9]{9}' : undefined}
                  />
                )}
              </div>
            ))}

            {/* Official Address */}
            <div style={{ flex: '1 1 100%' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#b4a383' }}>
                Official Address
              </label>
              <textarea
                required
                value={formdata.officeaddress}
                onChange={(e) => setformdata({ ...formdata, officeaddress: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                rows={3}
              />
            </div>
          </div>

          {/* Next Button */}
          <button type="submit" style={buttonStyle}>
            Next
          </button>
        </form>
      )}

      {tab === 2 && (
        <form onSubmit={handleNext}>
          {/* Form Fields */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {[
              { label: 'Permanent Address', name: 'paddress' },
              { label: 'City', name: 'city' },
              {
                label: 'State',
                type: 'select',
                name: 'state',
                options: statejosn,
              },
              {
                label: 'District',
                type: 'select',
                name: 'district',
                options: (statejosn.find((s) => s.state === formdata.state) || statejosn[0])?.districts || [],
              },
              { label: 'Pin Code', name: 'pincode', type: 'number' },
            ].map((field, idx) => (
              <div key={idx} style={formItem}>
                <label style={labelStyle}>{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    required
                    value={formdata[field.name]}
                    onChange={(e) => setformdata({ ...formdata, [field.name]: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">Select</option>
                    {field.options.map((opt, i) => (
                      <option key={i}>{field.label === 'State' ? opt.state : opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    value={formdata[field.name]}
                    onChange={(e) => setformdata({ ...formdata, [field.name]: e.target.value })}
                    type={field.type || 'text'}
                    style={inputStyle}
                  />
                )}
              </div>
            ))}
          </div>

          <h4 style={{ marginTop: 20 }}>Residence Details</h4>
          <label>
            <input
              type="checkbox"
              name="sameAsPermanent"
              checked={formdata.sameaddress}
              onChange={handleChange}
              style={{ marginRight: 8, marginBottom: 25 }}
            />
            Same as Permanent Address
          </label>

          {/* Form Fields */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {[
              { label: 'Residence Address', name: 'caddress' },
              { label: 'City', name: 'ccity' },
              {
                label: 'State',
                type: 'select',
                name: 'cstate',
                options: statejosn,
              },
              {
                label: 'District',
                type: 'select',
                name: 'cdistrict',
                options: (statejosn.find((s) => s.state === formdata.cstate) || statejosn[0])?.districts || [],
              },
              { label: 'Pin Code', name: 'cpincode', type: 'number' },
            ].map((field, idx) => (
              <div key={idx} style={formItem}>
                <label style={labelStyle}>{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    required
                    value={formdata[field.name]}
                    onChange={(e) => setformdata({ ...formdata, [field.name]: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">Select</option>
                    {field.options.map((opt, i) => (
                      <option key={i}>{field.name === 'cstate' ? opt.state : opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    value={formdata[field.name]}
                    onChange={(e) => setformdata({ ...formdata, [field.name]: e.target.value })}
                    type={field.type || 'text'}
                    style={inputStyle}
                  />
                )}
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: 20, marginBottom: '16px', borderBottom: 'solid' }}>Introducer Details:</h3>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Member ID</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                required
                value={formdata.introducerid}
                onChange={(e) => setformdata({ ...formdata, introducerid: e.target.value })}
                onBlur={() => getformdata(formdata.introducerid)}
                type="text"
                placeholder="Enter member ID (e.g. 0010001)"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => getformdata(formdata.introducerid)}
                style={{ ...buttonStyle, width: 'auto', marginBottom: 0, padding: '0 20px' }}
              >
                Fetch
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            {[
              { label: 'Name', name: 'introducername' },
              { label: 'Period Known', name: 'peroidknown', type: 'number' },
            ].map((field, idx) => (
              <div key={idx} style={formItem}>
                <label style={labelStyle}>{field.label}</label>
                <input
                  required
                  value={formdata[field.name]}
                  onChange={(e) => setformdata({ ...formdata, [field.name]: e.target.value })}
                  type={field.type || 'text'}
                  style={inputStyle}
                  placeholder={field.name === 'introducername' ? 'Auto-filled from Member ID' : ''}
                />
              </div>
            ))}
          </div>

          <button type="submit" style={buttonStyle}>
            Next
          </button>
          <button type="button" onClick={handlePrevious} style={buttonStyle}>
            Previous
          </button>
        </form>
      )}

      {tab === 3 && (
        <form onSubmit={handleNext}>
          {/* Form Fields */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: 16 }}>
            {[
              { label: 'Title', type: 'select', name: 'nomineetitle', options: ['Mr', 'Mrs', 'Miss'] },
              { label: 'Name', name: 'nomineename' },
              {
                label: 'Relationship',
                type: 'select',
                name: 'nomineerelation',
                options: ['Son', 'Wife', 'Father', 'Mother'],
              },
              { label: 'Date of Birth', name: 'nomineedob', type: 'date' },
              { label: 'Age', name: 'nomineeage', type: 'number' },
              { label: 'Address', name: 'nomineeaddress' },
            ].map((field, idx) => (
              <div key={idx} style={formItem}>
                <label style={labelStyle}>{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    required
                    value={formdata[field.name]}
                    onChange={(e) => setformdata({ ...formdata, [field.name]: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">Select</option>
                    {field.options.map((opt, i) => (
                      <option key={i}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    disabled={field.name === 'nomineeage'}
                    value={formdata[field.name]}
                    onChange={(e) => setformdata({ ...formdata, [field.name]: e.target.value })}
                    type={field.type || 'text'}
                    style={inputStyle}
                  />
                )}
              </div>
            ))}
          </div>

          {(formdata.nomineeage < 18 || formdata.nomineeage === '') && (
            <>
              <h4 style={{ margin: '20px 0' }}>Guardian Details</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                {[
                  { label: 'Title', type: 'select', name: 'gurdiantitle', options: ['Mr', 'Mrs', 'Miss'] },
                  { label: 'Name', name: 'gurdianname' },
                  {
                    label: 'Relationship',
                    type: 'select',
                    name: 'gurdianrelation',
                    options: ['Son', 'Wife', 'Father', 'Mother'],
                  },
                  { label: 'Date of Birth', name: 'gurdiandob', type: 'date' },
                  { label: 'Age', name: 'gurdianage', type: 'number' },
                ].map((field, idx) => (
                  <div key={idx} style={formItem}>
                    <label style={labelStyle}>{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        required
                        value={formdata[field.name]}
                        onChange={(e) => setformdata({ ...formdata, [field.name]: e.target.value })}
                        style={inputStyle}
                      >
                        <option value="">Select</option>
                        {field.options.map((opt, i) => (
                          <option key={i}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        required
                        value={formdata[field.name]}
                        disabled={field.name === 'gurdianage'}
                        onChange={(e) => setformdata({ ...formdata, [field.name]: e.target.value })}
                        type={field.type || 'text'}
                        style={inputStyle}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <button type="submit" style={buttonStyle}>
            Next
          </button>
          <button type="button" onClick={handlePrevious} style={buttonStyle}>
            Previous
          </button>
        </form>
      )}

      {tab === 4 && (
        <form onSubmit={create}>
          {/* Form Fields */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            {[
              {
                label: 'ID Proof',
                type: 'select',
                name: 'idproof',
                options: ['Aadhar', 'PAN', 'Voter ID', 'Passport', 'Driving License', 'Govt. ID', 'Other'],
              },
              { label: 'Document Number', name: 'idproofnumber', type: 'text' },
              {
                label: 'Address Proof',
                type: 'select',
                name: 'addressproof',
                options: ['Aadhar', 'PAN', 'Voter ID', 'Passport', 'Driving License', 'Govt. ID', 'Other'],
              },
              { label: 'Document Number', name: 'addressproofnumber', type: 'text' },
              { label: 'Upload Photo', name: 'photo', type: 'file' },
              { label: 'Upload ID Front', name: 'idfront', type: 'file' },
              { label: 'Upload ID Back', name: 'idback', type: 'file' },
              { label: 'Upload Address Front', name: 'addfront', type: 'file' },
              { label: 'Upload Address Back', name: 'addback', type: 'file' },
            ].map((field, idx) => (
              <div key={idx} style={formItem}>
                <label style={labelStyle}>{field.label}</label>

                {field.type === 'select' ? (
                  <select
                    required
                    value={formdata[field.name] || ''}
                    onChange={(e) => setformdata({ ...formdata, [field.name]: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">Select</option>
                    {field.options.map((opt, i) => (
                      <option key={i}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'file' ? (
                  <input
                    required
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setformdata({ ...formdata, [field.name]: file });
                      }
                    }}
                    style={inputStyle}
                  />
                ) : (
                  <input
                    required
                    value={formdata[field.name] || ''}
                    onChange={(e) => setformdata({ ...formdata, [field.name]: e.target.value })}
                    type={field.type || 'text'}
                    style={inputStyle}
                  />
                )}
              </div>
            ))}
          </div>

          <button type="submit" style={buttonStyle}>
            Submit
          </button>
          <button type="button" onClick={handlePrevious} style={buttonStyle}>
            Previous
          </button>
        </form>
      )}
    </div>
  );
};

const container = {
  maxWidth: '800px',
  margin: 'auto',
  padding: '20px',
  backgroundColor: '#fff',
  borderRadius: '10px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  fontFamily: 'Arial, sans-serif',
};

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontWeight: 'bold',
  color: '#b4a383',
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #b4a383',
};

const buttonStyle = {
  width: '100%',
  backgroundColor: '#385FBF',
  color: '#b4a383',
  padding: '10px',
  border: 'none',
  borderRadius: '6px',
  fontWeight: 'bold',
  marginBottom: '20px',
  cursor: 'pointer',
};

const formItem = {
  flex: '1 1 48%',
  minWidth: '250px',
};

export default MemberApplicationForm;
