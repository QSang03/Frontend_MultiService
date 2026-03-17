const fs = require('fs');
let code = fs.readFileSync('C:/Users/sangnq/Downloads/IT_MultiService/Frontend_MultiService/src/app/customer/b2c/tickets/[id]/page.tsx', 'utf8');

// 1. Add Star and TicketRatingModal imports
code = code.replace("AlertCircle,", "AlertCircle,\n  Star,");
code = code.replace("import { useParams } from 'next/navigation';", `import { useParams } from 'next/navigation';
import TicketRatingModal from '@/components/TicketRatingModal';`);

// 2. Add rating states inside component
const stateTarget = "const [locationTracking, setLocationTracking] = useState(false);";
const stateAdd = `const [locationTracking, setLocationTracking] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratedStars, setRatedStars] = useState<number | null>(null);`;

code = code.replace(stateTarget, stateAdd);

// 3. Add rating banner below Timeline
const timelineTarget = "{/* Details + Chat grid */}";
const ratingBanner = `{/* Rating Section (SRS III.5) */}
        {ticket.status >= 9 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-amber-950 text-sm">
                  {ratedStars ? \`Bạn đã đánh giá \${ratedStars} sao cho dịch vụ này\` : 'Đánh giá chất lượng phục vụ & Kỹ thuật viên'}
                </h3>
                <p className="text-xs text-amber-800">
                  {ratedStars ? 'Cảm ơn ý kiến đóng góp quý báu của bạn!' : 'Chia sẻ mức độ hài lòng của bạn sau khi công việc hoàn tất.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRatingModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
            >
              {ratedStars ? 'Đánh giá lại' : 'Đánh giá ngay (1-5★)'}
            </button>
          </div>
        )}

        {/* Details + Chat grid */}`;

code = code.replace(timelineTarget, ratingBanner);

// 4. Add TicketRatingModal before closing div
const modalAdd = `      {/* Ticket Rating Modal (SRS III.5) */}
      {ticket && (
        <TicketRatingModal
          isOpen={showRatingModal}
          ticketId={ticket.id}
          ticketTitle={ticket.title}
          technicianName="Kỹ thuật viên MultiService"
          onClose={() => setShowRatingModal(false)}
          onSubmitSuccess={(s) => {
            setRatedStars(s);
            setShowRatingModal(false);
          }}
        />
      )}
    </div>`;

code = code.replace(/    <\/div>\s*;\s*\}\s*$/, modalAdd + '\n;\n}');

fs.writeFileSync('C:/Users/sangnq/Downloads/IT_MultiService/Frontend_MultiService/src/app/customer/b2c/tickets/[id]/page.tsx', code, 'utf8');
console.log('Successfully patched b2c ticket detail page with TicketRatingModal!');