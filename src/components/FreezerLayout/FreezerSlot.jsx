import React from 'react';

const FreezerSlot = ({ slotData, onClick, isSelected }) => {
    const { id, name, rows = [], color } = slotData || {};

    const containerStyle = {
        border: isSelected ? '2px solid #007bff' : '1px solid #ccc',
        borderRadius: '8px',
        padding: '12px',
        minHeight: '100px',
        backgroundColor: color || '#f8f9fa',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s',
        boxShadow: isSelected ? '0 0 8px rgba(0,123,255,0.5)' : 'none',
        position: 'relative'
    };

    const headerStyle = {
        fontSize: '14px',
        color: '#495057',
        marginBottom: '8px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        textAlign: 'center',
        borderBottom: '1px solid #dee2e6',
        paddingBottom: '6px'
    };

    const rowsContainerStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        width: '100%'
    };

    const rowStyle = {
        fontSize: '12px',
        color: '#333',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 0'
    };

    const rowLabelStyle = {
        fontWeight: '600',
        color: '#6c757d'
    };

    const rowValueStyle = {
        fontWeight: '500',
        color: '#212529'
    };

    const emptyStyle = {
        fontSize: '12px',
        color: '#adb5bd',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: '8px'
    };

    return (
        <div style={containerStyle} onClick={onClick}>
            <div style={headerStyle}>{name || `Sección ${id}`}</div>

            {rows && rows.length > 0 ? (
                <div style={rowsContainerStyle}>
                    {rows.map((row, index) => (
                        <div key={index} style={rowStyle}>
                            <span style={rowLabelStyle}>{row.label}:</span>
                            <span style={rowValueStyle}>{row.value}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={emptyStyle}>Sin información</div>
            )}
        </div>
    );
};

export default FreezerSlot;
