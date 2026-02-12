export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(44,40,37,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 380,
          padding: '28px 28px 22px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: '0 0 20px', fontSize: 15, color: '#2C2825', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 20px',
              fontSize: 13,
              fontWeight: 500,
              border: '1px solid #E5E0DA',
              borderRadius: 10,
              background: '#F7F4F0',
              color: '#6B6560',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 20px',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              borderRadius: 10,
              background: '#E85D4A',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
