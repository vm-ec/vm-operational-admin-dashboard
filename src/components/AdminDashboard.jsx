import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";

// H2 Database API endpoints
const SERVICES_URL = "http://localhost:8080/api/services";
const EXTERNAL_SERVICES_URL = "http://localhost:8080/api/external-services";
const APPLICATIONS_URL = "http://localhost:8080/api/applications";
const DASHBOARD_CONFIG_URL = "http://localhost:8080/api/dashboard-config/full";
const INIT_DATA_URL = "http://localhost:8080/api/dashboard-config/init-from-file";

const AdminDashboard = () => {

  const [services, setServices] = useState([]);
  const [externalServices, setExternalServices] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingExternalId, setEditingExternalId] = useState(null);
  const [activeSection, setActiveSection] = useState('services');
  const [dashboardStatus, setDashboardStatus] = useState({ status: 'unknown', lastSync: 'Never' });
  const [syncMessage, setSyncMessage] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    prodUrl: "",
    sandboxUrl: ""
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState("");

  // ---------------- LOAD INITIAL DATA FROM H2 DATABASE ----------------

  useEffect(() => {
    // Load persisted sync message and time from localStorage
    const savedSyncMessage = localStorage.getItem('adminDashboard_syncMessage');
    const savedSyncTime = localStorage.getItem('adminDashboard_lastSyncTime');
    
    if (savedSyncMessage) {
      setSyncMessage(savedSyncMessage);
    }
    
    if (savedSyncTime) {
      setLastSyncTime(new Date(parseInt(savedSyncTime)));
    }
    
    // Load all data from H2 database
    fetchDashboardData();
    fetchServices();
    fetchExternalServices();
    
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // ---------------- FETCH DASHBOARD DATA FROM H2 ----------------

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(DASHBOARD_CONFIG_URL);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setDashboardStatus({
          status: 'active',
          lastSync: data.timestamp,
          totalTiles: data.totalTiles
        });
        console.log('Dashboard data loaded from H2:', data);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data from H2:', error);
      setDashboardStatus({ status: 'offline', lastSync: 'Never' });
    }
  };

  // ---------------- INITIALIZE DATA FROM ENVIRONMENTS.TS ----------------

  const initializeDataFromFile = async () => {
    try {
      const response = await fetch(INIT_DATA_URL, { method: 'POST' });
      if (response.ok) {
        const result = await response.json();
        console.log('Data initialized:', result);
        setSyncMessage(`✓ Initialized ${result.services} services, ${result.applications} applications, ${result.externalServices} external services`);
        
        // Refresh all data
        await fetchDashboardData();
        await fetchServices();
        await fetchExternalServices();
        
        const currentTime = new Date();
        setLastSyncTime(currentTime);
        localStorage.setItem('adminDashboard_lastSyncTime', currentTime.getTime().toString());
      } else {
        throw new Error('Failed to initialize data');
      }
    } catch (error) {
      console.error('Failed to initialize data:', error);
      setSyncMessage(`✗ Failed to initialize data: ${error.message}`);
    }
  };

  // ---------------- FETCH SERVICES FROM H2 DATABASE ----------------

  const fetchServices = async () => {
    try {
      const response = await fetch(SERVICES_URL);
      if (response.ok) {
        const data = await response.json();
        console.log('Services loaded from H2:', data);
        setServices(data);
      } else {
        console.error('Failed to fetch services from H2');
        setServices([]);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
      setServices([]);
    }
  };

  const fetchExternalServices = async () => {
    try {
      const response = await fetch(EXTERNAL_SERVICES_URL);
      if (response.ok) {
        const data = await response.json();
        setExternalServices(data);
        console.log('External services loaded from H2:', data);
      } else {
        console.error('Failed to fetch external services from H2');
        setExternalServices([]);
      }
    } catch (error) {
      console.error('Failed to fetch external services:', error);
      setExternalServices([]);
    }
  };

  const fetchApplications = async (serviceId) => {
    try {
      const response = await fetch(`${APPLICATIONS_URL}/service/${serviceId}`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
        console.log('Applications loaded from H2:', data);
      } else {
        console.error('Failed to fetch applications from H2');
        setApplications([]);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      setApplications([]);
    }
  };

  // ---------------- SERVICE SELECTION ----------------

  const handleServiceClick = (service) => {
    setSelectedService(service);
    fetchApplications(service.id);
  };

  const handleBackToServices = () => {
    setSelectedService(null);
    setApplications([]);
  };

  // ---------------- EDIT SERVICE ----------------

  const handleEditService = (service) => {
    setEditingServiceId(service.id);
    setEditFormData({
      name: service.serviceName,
      description: service.description,
      prodUrl: '',
      sandboxUrl: ''
    });
  };

  const handleSaveService = async (serviceId) => {
    const updatedServices = services.map((service) => {
      if (service.id === serviceId) {
        return {
          ...service,
          serviceName: editFormData.name,
          description: editFormData.description
        };
      }
      return service;
    });
    setServices(updatedServices);
    setEditingServiceId(null);
    
    // Update selected service if it's the one being edited
    if (selectedService && selectedService.id === serviceId) {
      setSelectedService(updatedServices.find(s => s.id === serviceId));
    }
    
    // Save to H2 database
    const serviceToUpdate = updatedServices.find(s => s.id === serviceId);
    try {
      const response = await fetch(`${SERVICES_URL}/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceToUpdate)
      });
      
      if (response.ok) {
        const successMessage = `✓ Updated ${serviceToUpdate.serviceName} successfully`;
        setSyncMessage(successMessage);
        localStorage.setItem('adminDashboard_syncMessage', successMessage);
      } else {
        throw new Error('Failed to save service');
      }
    } catch (error) {
      console.error('Failed to save service:', error);
      const errorMessage = `✗ Failed to update ${serviceToUpdate.serviceName}: ${error.message}`;
      setSyncMessage(errorMessage);
      localStorage.setItem('adminDashboard_syncMessage', errorMessage);
    }
  };

  // ---------------- INPUT CHANGE ----------------

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  // ---------------- APPLICATION MANAGEMENT ----------------

  const handleEditApplication = (app) => {
    setEditingId(app.id);
    setEditFormData({
      name: app.applicationName,
      description: '',
      prodUrl: app.prodUrl,
      sandboxUrl: app.sandboxUrl
    });
  };

  const handleSaveApplication = async (appId) => {
    const updatedApps = applications.map((app) => {
      if (app.id === appId) {
        return {
          ...app,
          applicationName: editFormData.name,
          prodUrl: editFormData.prodUrl,
          sandboxUrl: editFormData.sandboxUrl
        };
      }
      return app;
    });
    setApplications(updatedApps);
    setEditingId(null);
    
    const appToUpdate = updatedApps.find(a => a.id === appId);
    
    // Save to H2 database
    try {
      const response = await fetch(`${APPLICATIONS_URL}/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appToUpdate)
      });
      
      if (response.ok) {
        const successMessage = `✓ Updated ${appToUpdate.applicationName} successfully`;
        setSyncMessage(successMessage);
        localStorage.setItem('adminDashboard_syncMessage', successMessage);
        console.log('Successfully saved to H2 database');
      } else {
        throw new Error('Failed to save to H2 database');
      }
    } catch (error) {
      console.error('Failed to save application:', error);
      const errorMessage = `✗ Failed to update ${appToUpdate.applicationName}: ${error.message}`;
      setSyncMessage(errorMessage);
      localStorage.setItem('adminDashboard_syncMessage', errorMessage);
    }
  };

  const handleDeleteApplication = async (appId) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      setApplications(applications.filter(app => app.id !== appId));
      await fetch(`${APPLICATIONS_URL}/${appId}`, { method: 'DELETE' });
    }
  };

  const handleEditExternalService = (service) => {
    setEditingExternalId(service.id);
    setEditFormData({
      name: service.serviceName,
      description: service.description || '',
      prodUrl: service.serviceUrl,
      sandboxUrl: service.integrationType || 'REST'
    });
  };

  const handleSaveExternalService = async (serviceId) => {
    const updatedServices = externalServices.map((service) => {
      if (service.id === serviceId) {
        return {
          ...service,
          serviceName: editFormData.name,
          serviceUrl: editFormData.prodUrl,
          integrationType: editFormData.sandboxUrl,
          description: editFormData.description
        };
      }
      return service;
    });
    setExternalServices(updatedServices);
    setEditingExternalId(null);
    
    const serviceToUpdate = updatedServices.find(s => s.id === serviceId);
    await fetch(`${EXTERNAL_SERVICES_URL}/${serviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceToUpdate)
    });
  };

  const handleAddApplication = async () => {
    const newApp = {
      applicationName: 'New Application',
      prodUrl: 'https://new-service/health',
      sandboxUrl: 'https://sandbox-new-service/health',
      serviceId: selectedService.id,
      createdBy: 'admin',
      updatedBy: 'admin'
    };
    
    const response = await fetch(APPLICATIONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApp)
    });
    
    if (response.ok) {
      const savedApp = await response.json();
      setApplications([...applications, savedApp]);
    }
  };

  // ---------------- SAVE DATA TO H2 ----------------

  const handleBulkSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      // Save all services
      await fetch(`${SERVICES_URL}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(services)
      });

      // Save all external services
      await fetch(`${EXTERNAL_SERVICES_URL}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(externalServices)
      });

      alert('All configurations successfully saved!');
    } catch (error) {
      console.error('Save failed', error);
      alert('Error saving configurations');
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------- SEARCH FILTER ----------------

  const filteredServices = services.filter((service) =>
    service.serviceName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredExternalServices = externalServices.filter((service) =>
    service.serviceName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredApplications = applications.filter((app) =>
    app.applicationName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">⚙️</span>
            <span className="logo-text">Config Console</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-label">NAVIGATION</div>
          
          <button 
            className={`nav-item ${activeSection === 'services' ? 'active' : ''}`}
            onClick={() => setActiveSection('services')}
          >
            <span className="nav-icon">📦</span>
            <span>Services</span>
          </button>
          
          <button 
            className={`nav-item ${activeSection === 'external' ? 'active' : ''}`}
            onClick={() => setActiveSection('external')}
          >
            <span className="nav-icon">🌐</span>
            <span>External Services</span>
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        
        <div className="content-header">
          <div>
            <h1>Admin Configuration Console</h1>
            <div className="status-bar">
              <span className={`status-indicator ${dashboardStatus.status}`}>
                {dashboardStatus.status === 'active' ? '● Online' : '● Offline'}
              </span>
              <span className="last-sync">
                Last Sync: {lastSyncTime ? lastSyncTime.toLocaleString() : 'Never'}
              </span>
              {dashboardStatus.totalTiles > 0 && (
                <span className="tile-count">Tiles: {dashboardStatus.totalTiles}</span>
              )}
            </div>
          </div>
          
          <div className="header-actions">
            <button
              type="button"
              className="sync-btn"
              onClick={initializeDataFromFile}
              disabled={isSyncing}
            >
              {isSyncing ? '⟳ Loading...' : '⟳ Load from Database'}
            </button>
            
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {syncMessage && (
          <div className={`sync-message ${syncMessage.includes('✓') ? 'success' : 'error'}`}>
            {syncMessage}
          </div>
        )}

        <div className="content-body">
          
          {/* SERVICES SECTION */}
          {activeSection === 'services' && !selectedService && (
            <div className="section">
              <h2 className="section-title">Services</h2>
              
              <div className="services-grid">
                {filteredServices.map((service) => (
                  <div key={service.id} className="service-card">
                    <div className="service-header">
                      <div className="service-info">
                        <span className="service-icon">📦</span>
                        <div className="service-content">
                          {editingServiceId === service.id ? (
                            <div className="edit-service-form">
                              <input
                                type="text"
                                name="name"
                                value={editFormData.name}
                                onChange={handleFormChange}
                                className="service-name-input"
                                onBlur={() => handleSaveService(service.id)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveService(service.id);
                                  }
                                }}
                                autoFocus
                              />
                              <textarea
                                name="description"
                                value={editFormData.description}
                                onChange={handleFormChange}
                                className="service-description-input"
                                onBlur={() => handleSaveService(service.id)}
                                placeholder="Service description..."
                              />
                            </div>
                          ) : (
                            <>
                              <h3 
                                className="service-name-clickable"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditService(service);
                                }}
                                title="Click to edit service name"
                              >
                                {service.serviceName}
                              </h3>
                              <p 
                                className="service-description-clickable"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditService(service);
                                }}
                                title="Click to edit description"
                              >
                                {service.description}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <button 
                        className="expand-btn"
                        onClick={() => handleServiceClick(service)}
                        title="Click to view applications"
                      >
                        <span className="expand-icon">▶</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* APPLICATIONS TABLE FOR SELECTED SERVICE */}
          {activeSection === 'services' && selectedService && (
            <div className="section">
              <div className="section-header">
                <button className="back-btn" onClick={handleBackToServices}>← Back to Services</button>
                <h2 className="section-title">{selectedService.serviceName} - Applications</h2>
                <button className="add-btn" onClick={handleAddApplication}>+ Add Application</button>
              </div>
              
              <div className="table-wrapper">
                <table className="config-table">
                  <thead>
                    <tr>
                      <th>Application Name</th>
                      <th>Prod URL</th>
                      <th>Sandbox URL</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((app) => (
                      <tr key={app.id} className={editingId === app.id ? "editing" : ""}>
                        <td>
                          {editingId === app.id ? (
                            <input
                              type="text"
                              name="name"
                              value={editFormData.name}
                              onChange={handleFormChange}
                              className="app-name-input"
                            />
                          ) : (
                            <strong>{app.applicationName}</strong>
                          )}
                        </td>
                        
                        <td>
                          {editingId === app.id ? (
                            <input
                              type="text"
                              name="prodUrl"
                              value={editFormData.prodUrl}
                              onChange={handleFormChange}
                              className="url-input"
                            />
                          ) : (
                            <span className="url-text">{app.prodUrl}</span>
                          )}
                        </td>
                        
                        <td>
                          {editingId === app.id ? (
                            <input
                              type="text"
                              name="sandboxUrl"
                              value={editFormData.sandboxUrl}
                              onChange={handleFormChange}
                              className="url-input"
                            />
                          ) : (
                            <span className="url-text">{app.sandboxUrl}</span>
                          )}
                        </td>
                        
                        <td>
                          {editingId === app.id ? (
                            <>
                              <button className="action-btn btn-confirm" onClick={() => handleSaveApplication(app.id)}>Save</button>
                              <button className="action-btn btn-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                              <button className="action-btn btn-delete" onClick={() => handleDeleteApplication(app.id)}>Delete</button>
                            </>
                          ) : (
                            <button className="action-btn btn-edit" onClick={() => handleEditApplication(app)}>Edit</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EXTERNAL SERVICES SECTION */}
          {activeSection === 'external' && (
            <div className="section">
              <h2 className="section-title">External Services</h2>
              
              <div className="table-wrapper">
                <table className="config-table">
                  <thead>
                    <tr>
                      <th>Service Name</th>
                      <th>Service URL</th>
                      <th>Integration Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExternalServices.map((service) => (
                      <tr key={service.id} className={editingExternalId === service.id ? "editing" : ""}>
                        <td>
                          {editingExternalId === service.id ? (
                            <input
                              type="text"
                              name="name"
                              value={editFormData.name}
                              onChange={handleFormChange}
                              className="app-name-input"
                            />
                          ) : (
                            <strong>{service.serviceName}</strong>
                          )}
                        </td>
                        <td>
                          {editingExternalId === service.id ? (
                            <input
                              type="text"
                              name="prodUrl"
                              value={editFormData.prodUrl}
                              onChange={handleFormChange}
                              className="url-input"
                            />
                          ) : (
                            <span className="url-text">{service.serviceUrl}</span>
                          )}
                        </td>
                        <td>
                          {editingExternalId === service.id ? (
                            <input
                              type="text"
                              name="sandboxUrl"
                              value={editFormData.sandboxUrl}
                              onChange={handleFormChange}
                              className="url-input"
                            />
                          ) : (
                            service.integrationType || 'REST'
                          )}
                        </td>
                        <td>
                          {editingExternalId === service.id ? (
                            <>
                              <button className="action-btn btn-confirm" onClick={() => handleSaveExternalService(service.id)}>Save</button>
                              <button className="action-btn btn-cancel" onClick={() => setEditingExternalId(null)}>Cancel</button>
                            </>
                          ) : (
                            <button className="action-btn btn-edit" onClick={() => handleEditExternalService(service)}>Edit</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;