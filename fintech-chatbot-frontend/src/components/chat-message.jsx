import { Card, Button } from 'react-bootstrap'
import { ThumbsUp, ThumbsDown, PersonCircle, Robot } from 'react-bootstrap-icons'

export function ChatMessage({ message, onFeedback }) {
  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const isUser = message.role === 'user'

  return (
    <div className={`d-flex ${isUser ? 'justify-content-end' : 'justify-content-start'} mb-3`}>
      {!isUser && (
        <div className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle me-2" style={{ width: 32, height: 32 }}>
          <Robot size={16} />
        </div>
      )}

      <div className="d-flex flex-column" style={{ maxWidth: '70%' }}>
        <Card
          bg={isUser ? 'primary' : 'light'}
          text={isUser ? 'white' : 'dark'}
          className={`p-3 ${isUser ? 'ms-auto' : ''}`}
        >
          <p className="mb-2">{message.content}</p>
          <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
            <small className={isUser ? 'text-white-50' : 'text-muted'}>
              {formatTime(message.timestamp)}
            </small>

            {!isUser && onFeedback && (
              <div className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm" onClick={() => onFeedback(message.id, 'up')}>
                  <ThumbsUp size={16} />
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={() => onFeedback(message.id, 'down')}>
                  <ThumbsDown size={16} />
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {isUser && (
        <div className="d-flex align-items-center justify-content-center bg-secondary text-white rounded-circle ms-2" style={{ width: 32, height: 32 }}>
          <PersonCircle size={16} />
        </div>
      )}
    </div>
  )
}
