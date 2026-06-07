import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from '../../api/api';
import styles from "./Groups.module.scss";
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import Switch from '@mui/material/Switch';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined';
import ConfirmDialog from "../../components/UI/ConfirmDialog/ConfirmDialog";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import EditGroupSidebar from '../../components/UI/ManagementSidebar/EditGroupSidebar';

export default function ArchiveGroups() {
  const navigate = useNavigate();
  const [groupData, setGroupData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState({ isOpen: false, groupId: null });
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, groupId: null });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editGroupData, setEditGroupData] = useState(null);

  const fetchArchivedGroups = () => {
    setIsLoading(true);
    api.get('/groups/archive')
      .then(res => setGroupData(res.data.data || []))
      .catch(err => console.error('Failed to load archived groups', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchArchivedGroups();
  }, []);

  const handleMenuOpen = (event, group) => {
    setAnchorEl(event.currentTarget);
    setActiveGroup(group);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveGroup(null);
  };

  const handleRestore = (group) => {
    setRestoreConfirm({ isOpen: true, groupId: group.id });
    handleMenuClose();
  };

  const handleDeleteForever = (group) => {
    setDeleteConfirm({ isOpen: true, groupId: group.id });
    handleMenuClose();
  };

  const handleEdit = (group) => {
    setEditGroupData(group);
    setIsEditOpen(true);

    api.get(`/groups/${group.id}`).then(res => {
      const freshData = res.data.data || res.data;
      if (freshData) {
        setEditGroupData(prev => ({
          ...prev,
          ...freshData
        }));
      }
    }).catch(err => {
      console.error('Error fetching group data in background:', err);
    });
    handleMenuClose();
  };

  const handleEditCancel = () => {
    setIsEditOpen(false);
    setEditGroupData(null);
  };

  const actualRestoreGroup = (id) => {
    setIsLoading(true);
    api.post(`/groups/${id}/restore`)
      .then(() => setGroupData(prev => prev.filter(g => g.id !== id)))
      .catch(err => console.error('Restore error', err))
      .finally(() => setIsLoading(false));
  };
  const actualDeleteGroup = (id) => {
    setIsLoading(true);
    api.delete(`/groups/${id}/force`)
      .then(() => setGroupData(prev => prev.filter(g => g.id !== id)))
      .catch(err => console.error('Delete error', err))
      .finally(() => setIsLoading(false));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Guruhlar Archive</h1>
        </div>
        <p className={styles.subtitle}>
          Arxivlangan guruhlar ro'yxati. Bu yerda o'chirilgan yoki arxivga ko'chirilgan guruhlarni ko'rishingiz mumkin.
        </p>
      </div>

      <div className={styles.tabs}>
        <button
          className={styles.tab}
          onClick={() => navigate('/dashboard/groups')}
        >
          <GroupsRoundedIcon fontSize="small" />
          Guruhlar
        </button>
        <button
          className={`${styles.tab} ${styles.activeTab}`}
        >
          <ArchiveOutlinedIcon fontSize="small" />
          Arxiv
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper} style={{ position: 'relative', opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.2s', minHeight: '150px' }}>
          {isLoading && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.4)',
              zIndex: 10
            }}>
              <CircularProgress sx={{ color: '#6c35de' }} />
            </Box>
          )}
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Status</th>
                <th>Guruh nomi</th>
                <th>Kurs</th>
                <th>Davomiyligi</th>
                <th>Dars vaqti</th>
                <th>Xona</th>
                <th>O'qituvchi</th>
                <th>Talabalar</th>
                <th style={{ textAlign: 'right' }}>
                  <RefreshRoundedIcon className={styles.refreshIcon} fontSize="small" onClick={fetchArchivedGroups} />
                </th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {groupData.map((group) => (
                <tr key={group.id} style={{ transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td>
                    <div className={styles.statusCell}>
                      <Switch
                        checked={false}
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          width: 44,
                          height: 24,
                          padding: 0,
                          '& .MuiSwitch-switchBase': {
                            padding: '2px',
                            '&.Mui-checked': {
                              transform: 'translateX(20px)',
                              color: '#fff',
                              '& + .MuiSwitch-track': {
                                backgroundColor: '#22c55e',
                                opacity: 1,
                              },
                            },
                          },
                          '& .MuiSwitch-thumb': {
                            width: 20,
                            height: 20,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                          },
                          '& .MuiSwitch-track': {
                            borderRadius: 12,
                            backgroundColor: '#e2e8f0',
                            opacity: 1,
                          },
                        }}
                      />
                      <span className={styles.statusLabel} style={{ color: '#ef4444' }}>NOFAOL</span>
                    </div>
                  </td>
                  <td><span className={styles.groupName}>{group.name}</span></td>
                  <td>
                    <span className={styles.courseTag}>{group.course?.name || "Kurs yo'q"}</span>
                  </td>
                  <td>
                    <span className={styles.duration}>{group.courses.duration_month}oy</span>
                  </td>
                  <td>
                    <div className={styles.timeInfo}>
                      <span className={styles.time}>{group.start_time}</span>
                      <span className={styles.days}>{group.week_day?.map(
                        item => item.toLowerCase().slice(0, 3)
                      ).join(',') || ""} <br /></span>
                    </div>
                  </td>
                  <td><span className={styles.room}>{group.rooms.name}</span></td>
                  <td>
                    <div className={styles.teachersList}>
                      {group.teachers?.map(
                        teacher => <span key={teacher.id} className={styles.teacherTag}>{teacher.full_name}</span>
                      ) || ""}
                    </div>
                  </td>
                  <td><span className={styles.studentCount}>{group.students?.length || 0}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <MoreVertRoundedIcon
                      className={styles.rowMoreIcon}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, group);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ConfirmDialog
          isOpen={restoreConfirm.isOpen}
          onClose={() => setRestoreConfirm({ isOpen: false, groupId: null })}
          onConfirm={() => {
            const id = restoreConfirm.groupId;
            setRestoreConfirm({ isOpen: false, groupId: null });
            if (id) actualRestoreGroup(id);
          }}
          title="Restore Group"
          message="Are you sure you want to restore this group?"
        />
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, groupId: null })}
          onConfirm={() => {
            const id = deleteConfirm.groupId;
            setDeleteConfirm({ isOpen: false, groupId: null });
            if (id) actualDeleteGroup(id);
          }}
          title="Delete Group Forever"
          message="This will permanently delete the archived group. Continue?"
        />
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
          PaperProps={{
            sx: {
              boxShadow: '0 6px 18px rgba(16,24,40,0.08)',
              border: '1px solid #e6edf6',
              borderRadius: '8px',
              padding: '4px',
              minWidth: '120px',
            },
          }}
        >
          <MenuItem
            onClick={() => handleRestore(activeGroup)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: '14px',
              borderRadius: '6px',
              '&:hover': { backgroundColor: '#f8fafc' },
            }}
          >
            <RestoreOutlinedIcon fontSize="small" />
            <span>Restore</span>
          </MenuItem>
          <MenuItem
            onClick={() => handleEdit(activeGroup)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: '14px',
              borderRadius: '6px',
              '&:hover': { backgroundColor: '#f8fafc' },
            }}
          >
            <EditRoundedIcon fontSize="small" />
            <span>Edit</span>
          </MenuItem>
        </Menu>
      </div>

      <EditGroupSidebar
        isOpen={isEditOpen}
        onClose={handleEditCancel}
        groupData={editGroupData}
        onSave={() => {
          fetchArchivedGroups();
        }}
      />
    </div>
  );
}
