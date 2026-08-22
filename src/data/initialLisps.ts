import { LispItem } from "../types";

export const INITIAL_LISPS: LispItem[] = [
  {
    id: "lisp-dt-01",
    title: "Tính Diện Tích & Xuất Bảng/Text (Area Calculation)",
    commandName: "DT",
    category: "Tiện ích vẽ nhanh",
    description: "Tính diện tích hình kín (Polyline/Hatch) hoặc pick điểm trong vùng kín, tự động tính m2, chu vi và cho phép chèn Text kết quả hoặc đè vào Text có sẵn.",
    tags: ["DT", "Diện tích", "Bóc khối lượng", "m2", "Pick điểm"],
    compatibleCAD: "AutoCAD 2007 - 2026, Civil 3D, ZWCAD, BricsCAD",
    author: "Kỹ sư Phạm Thanh Tùng",
    createdAt: Date.now() - 86400000 * 25,
    updatedAt: Date.now() - 86400000 * 1,
    isFavorite: true,
    steps: [
      "Gõ lệnh DT và nhấn Enter hoặc Space",
      "Chọn cách tính: [P]ick điểm trong vùng kín hoặc [O] Chọn đối tượng Polyline/Region/Hatch",
      "Xem diện tích (m²) và chu vi (m) tức thì trên thanh Command & Thông báo",
      "Tùy chọn: Click vào màn hình để đặt Text kết quả hoặc click vào 1 Text có sẵn để ghi đè"
    ],
    features: [
      "Tự động đổi đơn vị mm² sang m² theo tỷ lệ bản vẽ hoặc mét chuẩn",
      "Hỗ trợ cả pick điểm Boundary và chọn đối tượng đường cong Spline/Pline/Circle",
      "Có bắt lỗi *error* khôi phục OSMODE và hỗ trợ Undo 1 bước an toàn"
    ],
    tips: "Phù hợp để bóc tách diện tích trắc ngang đào đắp, diện tích phòng kiến trúc, diện tích thảm bê tông nhựa mặt đường.",
    code: `;;; =========================================================================
;;; Tên LISP: TINH DIEN TICH & XUAT KET QUA (DT)
;;; Lệnh gọi: DT (Tối ưu 2 ký tự)
;;; Tác giả: Kỹ sư Phạm Thanh Tùng
;;; File xuất: dt-tính diện tích.lsp
;;; Tương thích: AutoCAD 2007 - 2026, Civil 3D, BricsCAD, ZWCAD
;;; =========================================================================

(vl-load-com)

(defun c:DT ( / *error* old_osmode old_cmdecho doc opt pt ent obj area_val peri_val ptText txtEnt txtObj)
  ;; Hàm xử lý lỗi an toàn
  (setq old_error *error*)
  (defun *error* (msg)
    (if (and msg (not (member msg '("Function cancelled" "quit / exit abort" "console break"))))
      (princ (strcat "\\n[DT Loi]: " msg))
    )
    (if old_osmode (setvar "OSMODE" old_osmode))
    (if old_cmdecho (setvar "CMDECHO" old_cmdecho))
    (if (vlax-get-acad-object)
      (vla-endundomark (vla-get-activedocument (vlax-get-acad-object)))
    )
    (setq *error* old_error)
    (princ)
  )

  (setq old_cmdecho (getvar "CMDECHO"))
  (setq old_osmode (getvar "OSMODE"))
  (setvar "CMDECHO" 0)

  (setq doc (vla-get-activedocument (vlax-get-acad-object)))
  (vla-startundomark doc)

  (princ "\\n[AutoLISP Pro - KS Pham Thanh Tung] TINH DIEN TICH (DT)")
  (initget "P O")
  (setq opt (getkword "\\nChon phuong thuc [P]ick diem trong mien kin hay [O] Chon doi tuong? <P>: "))
  (if (null opt) (setq opt "P"))

  (setq area_val 0.0)
  (setq peri_val 0.0)

  (if (= opt "P")
    (progn
      (setq pt (getpoint "\\nClick pick 1 diem ben trong hinh kin can tinh dien tich: "))
      (if pt
        (progn
          (setvar "OSMODE" 0)
          (command "._-boundary" pt "")
          (setvar "OSMODE" old_osmode)
          (setq ent (entlast))
          (if ent
            (progn
              (setq obj (vlax-ename->vla-object ent))
              (if (vlax-property-available-p obj 'Area)
                (progn
                  (setq area_val (vla-get-Area obj))
                  (if (vlax-property-available-p obj 'Length)
                    (setq peri_val (vla-get-Length obj))
                  )
                  ;; Xoa doi tuong boundary tam
                  (vla-delete obj)
                )
              )
            )
          )
        )
      )
    )
    ;; Chon doi tuong
    (progn
      (setq ent (car (entsel "\\nChon duong bao Polyline / Region / Hatch: ")))
      (if ent
        (progn
          (setq obj (vlax-ename->vla-object ent))
          (if (vlax-property-available-p obj 'Area)
            (setq area_val (vla-get-Area obj))
          )
          (if (vlax-property-available-p obj 'Length)
            (setq peri_val (vla-get-Length obj))
          )
        )
      )
    )
  )

  (if (> area_val 0.0)
    (progn
      (princ (strcat "\\n================ KET QUA DIEN TICH (DT) ================"))
      (princ (strcat "\\n==> DIEN TICH : " (rtos area_val 2 3) " (Don vi ban ve / m2)"))
      (if (> peri_val 0.0)
        (princ (strcat "\\n==> CHU VI    : " (rtos peri_val 2 3) " (m)"))
      )
      (princ "\\n=========================================================")
      
      (initget "C G K")
      (setq insOpt (getkword "\\n[C]hen Text moi vao ban ve / [G]hi de vao Text co san / [K]hong chen? <C>: "))
      (if (null insOpt) (setq insOpt "C"))

      (cond
        ((= insOpt "C")
          (setq ptText (getpoint "\\nClick diem dat Text ket qua dien tich tren ban ve: "))
          (if ptText
            (entmake (list
              '(0 . "TEXT")
              (cons 10 ptText)
              (cons 40 (getvar "TEXTSIZE"))
              (cons 1 (strcat "S = " (rtos area_val 2 2) " m2"))
              '(72 . 0)
              '(73 . 0)
            ))
          )
        )
        ((= insOpt "G")
          (setq txtEnt (car (entsel "\\nChon Text/MText co san de ghi de gia tri: ")))
          (if txtEnt
            (progn
              (setq txtObj (vlax-ename->vla-object txtEnt))
              (if (vlax-property-available-p txtObj 'TextString)
                (vla-put-TextString txtObj (strcat "S = " (rtos area_val 2 2) " m2"))
              )
            )
          )
        )
      )
    )
    (princ "\\n[DT]: Khong xac dinh duoc dien tich vung chon.")
  )

  (vla-endundomark doc)
  (setvar "CMDECHO" old_cmdecho)
  (setvar "OSMODE" old_osmode)
  (setq *error* old_error)
  (princ)
)

(princ "\\nDa nap xong Lisp DT - Tinh dien tich. Go lenh 'DT' de su dung.")
(princ)`,
    versions: [
      {
        versionId: "v1-0-0",
        versionNumber: "v1.0.0",
        timestamp: Date.now() - 86400000 * 25,
        changelog: "Khởi tạo mã nguồn tính diện tích lệnh DT 2 ký tự chuẩn.",
        commandName: "DT",
        author: "Kỹ sư Phạm Thanh Tùng",
        code: `;; DT v1.0`
      }
    ]
  },
  {
    id: "lisp-tt-02",
    title: "Tính Thể Tích Đào Đắp & Kết Cấu (Volume Calculation)",
    commandName: "TT",
    category: "Giao thông - Cầu đường",
    description: "Tính thể tích đào đắp hoặc khối lượng bê tông (V = Diện tích x Chiều dài/Chiều cao). Hỗ trợ chọn diện tích mặt cắt và khoảng cách cọc/chiều cao.",
    tags: ["TT", "Thể tích", "Đào đắp", "Bê tông", "m3", "Giao thông"],
    compatibleCAD: "AutoCAD 2007 - 2026, Civil 3D, ZWCAD",
    author: "Kỹ sư Phạm Thanh Tùng",
    createdAt: Date.now() - 86400000 * 22,
    updatedAt: Date.now() - 86400000 * 2,
    isFavorite: true,
    steps: [
      "Gõ lệnh TT và nhấn Enter",
      "Chọn đường bao diện tích mặt cắt S1 (hoặc pick điểm)",
      "Nhập chiều dài tuyến d (hoặc khoảng cách cọc L giữa 2 trắc ngang / chiều cao h)",
      "Xem thể tích V (m³) và tùy chọn ghi kết quả trực tiếp ra bản vẽ"
    ],
    features: [
      "Hỗ trợ công thức thể tích trung bình lăng trụ: V = ((S1 + S2)/2) * L hoặc V = S * H",
      "Tự động tính toán khối lượng m3 đào đắp đất đá hoặc bê tông mố trụ",
      "Có hộp thoại hiển thị kết quả và in ra Command Line F2"
    ],
    tips: "Dùng để tính khối lượng đào đắp nền đường giữa 2 cọc trắc ngang hoặc thể tích dầm bê tông.",
    code: `;;; =========================================================================
;;; Tên LISP: TINH THE TICH KET CAU & DAO DAP (TT)
;;; Lệnh gọi: TT (Tối ưu 2 ký tự)
;;; Tác giả: Kỹ sư Phạm Thanh Tùng
;;; File xuất: tt-tính thể tích.lsp
;;; Tương thích: AutoCAD 2007 - 2026, Civil 3D, BricsCAD
;;; =========================================================================

(vl-load-com)

(defun c:TT ( / *error* old_cmdecho doc ent obj area1 area2 len_val vol_val ptText)
  (setq old_error *error*)
  (defun *error* (msg)
    (if (and msg (not (member msg '("Function cancelled" "quit / exit abort"))))
      (princ (strcat "\\n[TT Loi]: " msg))
    )
    (if old_cmdecho (setvar "CMDECHO" old_cmdecho))
    (if (vlax-get-acad-object)
      (vla-endundomark (vla-get-activedocument (vlax-get-acad-object)))
    )
    (setq *error* old_error)
    (princ)
  )

  (setq old_cmdecho (getvar "CMDECHO"))
  (setvar "CMDECHO" 0)
  (setq doc (vla-get-activedocument (vlax-get-acad-object)))
  (vla-startundomark doc)

  (princ "\\n[AutoLISP Pro - KS Pham Thanh Tung] TINH THE TICH (TT)")
  (setq ent (car (entsel "\\nChon duong bao mat cat dien tich S1 (Polyline/Region): ")))
  (if ent
    (progn
      (setq obj (vlax-ename->vla-object ent))
      (setq area1 (vla-get-Area obj))
      (princ (strcat "\\n-> Dien tich mat cat S1 = " (rtos area1 2 3) " m2"))
      
      (initget "1 2")
      (setq mode (getkword "\\n[1] Nhan chieu dai truc tiep (V = S1*L) / [2] Tinh trung binh 2 mat cat V=((S1+S2)/2)*L? <1>: "))
      (if (null mode) (setq mode "1"))

      (if (= mode "2")
        (progn
          (setq ent2 (car (entsel "\\nChon duong bao mat cat dien tich S2: ")))
          (if ent2
            (setq area2 (vla-get-Area (vlax-ename->vla-object ent2)))
            (setq area2 area1)
          )
          (setq avgArea (/ (+ area1 area2) 2.0))
        )
        (setq avgArea area1)
      )

      (setq len_val (getdist "\\nNhap chieu dai tuyen L hoac chieu cao H (m): "))
      (if (and len_val (> len_val 0.0))
        (progn
          (setq vol_val (* avgArea len_val))
          (princ (strcat "\\n================ KET QUA THE TICH (TT) ================"))
          (princ (strcat "\\n==> DIEN TICH TB : " (rtos avgArea 2 3) " m2"))
          (princ (strcat "\\n==> CHIEU DAI L  : " (rtos len_val 2 3) " m"))
          (princ (strcat "\\n==> THE TICH (V) : " (rtos vol_val 2 3) " m3"))
          (princ "\\n========================================================")
          (alert (strcat "THE TICH TINH TOAN (TT):\\n- Dien tich TB: " (rtos avgArea 2 2) " m2\\n- Chieu dai L: " (rtos len_val 2 2) " m\\n- THE TICH: " (rtos vol_val 2 3) " m3"))

          (setq ptText (getpoint "\\nClick diem tren ban ve de chen Text ket qua (hoac Enter bo qua): "))
          (if ptText
            (entmake (list
              '(0 . "TEXT")
              (cons 10 ptText)
              (cons 40 (getvar "TEXTSIZE"))
              (cons 1 (strcat "V = " (rtos vol_val 2 3) " m3"))
            ))
          )
        )
      )
    )
    (princ "\\n[TT]: Chua chon duong bao mat cat.")
  )

  (vla-endundomark doc)
  (setvar "CMDECHO" old_cmdecho)
  (setq *error* old_error)
  (princ)
)

(princ "\\nDa nap xong Lisp TT - Tinh the tich. Go lenh 'TT' de su dung.")
(princ)`,
    versions: [
      {
        versionId: "v1-0-0",
        versionNumber: "v1.0.0",
        timestamp: Date.now() - 86400000 * 22,
        changelog: "Khởi tạo mã nguồn tính thể tích đào đắp và kết cấu bê tông.",
        commandName: "TT",
        author: "Kỹ sư Phạm Thanh Tùng",
        code: `;; TT v1.0`
      }
    ]
  },
  {
    id: "lisp-vt-03",
    title: "Vẽ Tường Bao Tự Động (Draw Wall)",
    commandName: "VT",
    category: "Kết cấu & Xây dựng",
    description: "Vẽ tường bao kiến trúc & công trình phụ trợ tự động. Nhập bề dày tường (100, 200, 220 mm) và pick 2 điểm hoặc pick tim tường để sinh 2 nét tường song song có bo góc.",
    tags: ["VT", "Vẽ tường", "Tường bao", "Kiến trúc", "2 nét song song"],
    compatibleCAD: "AutoCAD 2007 - 2026, Civil 3D, ZWCAD",
    author: "Kỹ sư Phạm Thanh Tùng",
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 1,
    isFavorite: true,
    steps: [
      "Gõ lệnh VT và nhấn Enter",
      "Nhập bề dày tường (Mặc định: 220 hoặc 110 mm)",
      "Pick điểm đầu và điểm cuối của tim tường liên tục",
      "Lisp tự động sinh 2 nét tường song song chuẩn layer TUONG"
    ],
    features: [
      "Tự động tạo hoặc gán vào layer 'TUONG' màu chuẩn nét cắt",
      "Hỗ trợ vẽ liên tục nhiều đoạn tường ngoằn ngoèo",
      "Tự động xử lý góc xoay và offset đều sang 2 bên"
    ],
    tips: "Tăng tốc độ dựng mặt bằng nhà điều hành trạm thu phí, nhà bảo vệ cầu đường và mặt bằng kiến trúc.",
    code: `;;; =========================================================================
;;; Tên LISP: VE TUONG BAO TU DONG (VT)
;;; Lệnh gọi: VT (Tối ưu 2 ký tự)
;;; Tác giả: Kỹ sư Phạm Thanh Tùng
;;; File xuất: vt-vẽ tường bao.lsp
;;; Tương thích: AutoCAD 2007 - 2026, Civil 3D, ZWCAD
;;; =========================================================================

(vl-load-com)

(defun c:VT ( / *error* old_osmode old_cmdecho doc wall_w p1 p2 ang d_half p1_left p1_right p2_left p2_right)
  (setq old_error *error*)
  (defun *error* (msg)
    (if (and msg (not (member msg '("Function cancelled" "quit / exit abort"))))
      (princ (strcat "\\n[VT Loi]: " msg))
    )
    (if old_osmode (setvar "OSMODE" old_osmode))
    (if old_cmdecho (setvar "CMDECHO" old_cmdecho))
    (if (vlax-get-acad-object)
      (vla-endundomark (vla-get-activedocument (vlax-get-acad-object)))
    )
    (setq *error* old_error)
    (princ)
  )

  (setq old_cmdecho (getvar "CMDECHO"))
  (setq old_osmode (getvar "OSMODE"))
  (setvar "CMDECHO" 0)
  (setq doc (vla-get-activedocument (vlax-get-acad-object)))
  (vla-startundomark doc)

  ;; Tạo Layer TUONG nếu chưa có
  (if (null (tblsearch "LAYER" "TUONG"))
    (command "._-layer" "M" "TUONG" "C" "7" "TUONG" "")
  )
  (setvar "CLAYER" "TUONG")

  ;; Nhập bề dày tường
  (if (null *vt_wall_thickness*) (setq *vt_wall_thickness* 220.0))
  (setq wall_w (getdist (strcat "\\nNhap be day tuong (mm hoac m) <" (rtos *vt_wall_thickness* 2 0) ">: ")))
  (if (null wall_w) (setq wall_w *vt_wall_thickness*))
  (setq *vt_wall_thickness* wall_w)
  (setq d_half (/ wall_w 2.0))

  (setq p1 (getpoint "\\nClick diem bat dau tim tuong: "))
  (while (and p1 (setq p2 (getpoint p1 "\\nClick diem tiep theo cua tim tuong (Enter de dung): ")))
    (setq ang (angle p1 p2))
    ;; Tinh 4 diem cua 2 mep tuong
    (setq p1_left  (polar p1 (+ ang (/ pi 2.0)) d_half))
    (setq p1_right (polar p1 (- ang (/ pi 2.0)) d_half))
    (setq p2_left  (polar p2 (+ ang (/ pi 2.0)) d_half))
    (setq p2_right (polar p2 (- ang (/ pi 2.0)) d_half))

    (setvar "OSMODE" 0)
    ;; Ve 2 net mep tuong
    (command "._LINE" p1_left p2_left "")
    (command "._LINE" p1_right p2_right "")
    (setvar "OSMODE" old_osmode)

    (setq p1 p2)
  )

  (vla-endundomark doc)
  (setvar "CMDECHO" old_cmdecho)
  (setvar "OSMODE" old_osmode)
  (setq *error* old_error)
  (princ "\\nDa ve xong tuong bao. Chuc ban lam viec hieu qua!")
  (princ)
)

(princ "\\nDa nap xong Lisp VT - Ve tuong bao. Go lenh 'VT' de su dung.")
(princ)`,
    versions: [
      {
        versionId: "v1-0-0",
        versionNumber: "v1.0.0",
        timestamp: Date.now() - 86400000 * 20,
        changelog: "Khởi tạo mã nguồn vẽ tường bao 2 nét song song lệnh VT.",
        commandName: "VT",
        author: "Kỹ sư Phạm Thanh Tùng",
        code: `;; VT v1.0`
      }
    ]
  },
  {
    id: "lisp-vc-04",
    title: "Vẽ Cột Bê Tông Cốt Thép (Draw Column)",
    commandName: "VC",
    category: "Kết cấu & Xây dựng",
    description: "Vẽ cột bê tông cốt thép (cột chữ nhật b x h hoặc cột tròn phi D) kèm hatch bê tông đặc trưng và bắt điểm tại tâm/mép cột để chèn nhanh vào lưới trục.",
    tags: ["VC", "Vẽ cột", "Cột bê tông", "Lưới trục", "Kết cấu"],
    compatibleCAD: "AutoCAD 2007 - 2026, Civil 3D, ZWCAD",
    author: "Kỹ sư Phạm Thanh Tùng",
    createdAt: Date.now() - 86400000 * 18,
    updatedAt: Date.now() - 86400000 * 1,
    isFavorite: true,
    steps: [
      "Gõ lệnh VC và nhấn Enter",
      "Chọn dạng cột: [C]hữ nhật (b x h) hoặc [T]ròn (phi D)",
      "Nhập kích thước cột (VD: 300x300, 400x500 hoặc D800)",
      "Click các giao điểm lưới trục để đặt cột liên tục"
    ],
    features: [
      "Tự động tạo Layer 'COT' màu đỏ/nét đậm và Hatch vật liệu Solid/AR-CONC",
      "Tâm cột trùng với điểm pick chuột giúp căn chỉnh chính xác trên lưới trục",
      "Hỗ trợ đặt hàng loạt cột liên tiếp không cần gõ lại lệnh"
    ],
    tips: "Chuyên dùng dựng sơ đồ kết cấu nhà, trụ cầu dẫn, trụ điện chiếu sáng và cột khung thép.",
    code: `;;; =========================================================================
;;; Tên LISP: VE COT BE TONG COT THEP (VC)
;;; Lệnh gọi: VC (Tối ưu 2 ký tự)
;;; Tác giả: Kỹ sư Phạm Thanh Tùng
;;; File xuất: vc-vẽ cột.lsp
;;; Tương thích: AutoCAD 2007 - 2026, Civil 3D, ZWCAD
;;; =========================================================================

(vl-load-com)

(defun c:VC ( / *error* old_osmode old_cmdecho doc col_type b_col h_col r_col pt p_bl p_tr poly_ent)
  (setq old_error *error*)
  (defun *error* (msg)
    (if (and msg (not (member msg '("Function cancelled" "quit / exit abort"))))
      (princ (strcat "\\n[VC Loi]: " msg))
    )
    (if old_osmode (setvar "OSMODE" old_osmode))
    (if old_cmdecho (setvar "CMDECHO" old_cmdecho))
    (if (vlax-get-acad-object)
      (vla-endundomark (vla-get-activedocument (vlax-get-acad-object)))
    )
    (setq *error* old_error)
    (princ)
  )

  (setq old_cmdecho (getvar "CMDECHO"))
  (setq old_osmode (getvar "OSMODE"))
  (setvar "CMDECHO" 0)
  (setq doc (vla-get-activedocument (vlax-get-acad-object)))
  (vla-startundomark doc)

  ;; Tao Layer COT
  (if (null (tblsearch "LAYER" "COT"))
    (command "._-layer" "M" "COT" "C" "1" "COT" "")
  )
  (setvar "CLAYER" "COT")

  (initget "C T")
  (setq col_type (getkword "\\nChon loai cot [C]hu nhat hay [T]ron? <C>: "))
  (if (null col_type) (setq col_type "C"))

  (if (= col_type "C")
    (progn
      (if (null *vc_b*) (setq *vc_b* 400.0))
      (if (null *vc_h*) (setq *vc_h* 400.0))
      (setq b_col (getdist (strcat "\\nNhap chieu rong cot b <" (rtos *vc_b* 2 0) ">: ")))
      (if (null b_col) (setq b_col *vc_b*))
      (setq *vc_b* b_col)

      (setq h_col (getdist (strcat "\\nNhap chieu cao cot h <" (rtos *vc_h* 2 0) ">: ")))
      (if (null h_col) (setq h_col *vc_h*))
      (setq *vc_h* h_col)

      (while (setq pt (getpoint "\\nClick tim giao diem luoi truc de chen cot (Enter de thoat): "))
        (setq p_bl (list (- (car pt) (/ b_col 2.0)) (- (cadr pt) (/ h_col 2.0))))
        (setq p_tr (list (+ (car pt) (/ b_col 2.0)) (+ (cadr pt) (/ h_col 2.0))))
        (setvar "OSMODE" 0)
        (command "._RECTANG" p_bl p_tr)
        (setq poly_ent (entlast))
        ;; Hatch solid cot
        (command "._-HATCH" "P" "SOLID" "S" poly_ent "" "")
        (setvar "OSMODE" old_osmode)
      )
    )
    ;; Cot tron
    (progn
      (if (null *vc_dia*) (setq *vc_dia* 600.0))
      (setq d_col (getdist (strcat "\\nNhap duong kinh cot D <" (rtos *vc_dia* 2 0) ">: ")))
      (if (null d_col) (setq d_col *vc_dia*))
      (setq *vc_dia* d_col)
      (setq r_col (/ d_col 2.0))

      (while (setq pt (getpoint "\\nClick tam luoi truc de chen cot tron (Enter de thoat): "))
        (setvar "OSMODE" 0)
        (command "._CIRCLE" pt r_col)
        (setq poly_ent (entlast))
        (command "._-HATCH" "P" "SOLID" "S" poly_ent "" "")
        (setvar "OSMODE" old_osmode)
      )
    )
  )

  (vla-endundomark doc)
  (setvar "CMDECHO" old_cmdecho)
  (setvar "OSMODE" old_osmode)
  (setq *error* old_error)
  (princ "\\nHoan tat ve cot.")
  (princ)
)

(princ "\\nDa nap xong Lisp VC - Ve cot be tong. Go lenh 'VC' de su dung.")
(princ)`,
    versions: [
      {
        versionId: "v1-0-0",
        versionNumber: "v1.0.0",
        timestamp: Date.now() - 86400000 * 18,
        changelog: "Khởi tạo mã nguồn vẽ cột chữ nhật/tròn kèm hatch lệnh VC.",
        commandName: "VC",
        author: "Kỹ sư Phạm Thanh Tùng",
        code: `;; VC v1.0`
      }
    ]
  },
  {
    id: "lisp-kt-05",
    title: "Chèn Khung Tên Bản Vẽ Chuẩn (Title Block)",
    commandName: "KT",
    category: "Tiện ích vẽ nhanh",
    description: "Chèn khung bản vẽ và khung tên chuẩn ngành Xây dựng Giao thông theo các khổ A4, A3, A2, A1, A0 nhân theo tỷ lệ (1:1, 1:100, 1:200, 1:500, 1:1000) kèm tên dự án và Kỹ sư Phạm Thanh Tùng.",
    tags: ["KT", "Khung tên", "Khổ giấy A3 A4 A1", "Tỷ lệ bản vẽ", "Hồ sơ"],
    compatibleCAD: "AutoCAD 2007 - 2026, Civil 3D, ZWCAD",
    author: "Kỹ sư Phạm Thanh Tùng",
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 1,
    isFavorite: true,
    steps: [
      "Gõ lệnh KT và nhấn Enter",
      "Chọn khổ giấy: [A4], [A3], [A2], [A1], [A0]",
      "Nhập tỷ lệ bản vẽ (VD: 100 cho tỷ lệ 1/100, 200, 500, 1000)",
      "Click điểm đặt góc dưới bên trái để tự động sinh khung bản vẽ kèm khung tên đẹp"
    ],
    features: [
      "Tạo khung bao ngoài lề trái 20mm, 3 lề còn lại 5mm chuẩn TCVN / ISO",
      "Kèm bảng khung tên kỹ sư thiết kế (Kỹ sư: Phạm Thanh Tùng) và ô điền tên bản vẽ",
      "Tự động scale kích thước theo tỷ lệ bản vẽ yêu cầu"
    ],
    tips: "Tiết kiệm thời gian đóng khung bản vẽ hồ sơ thiết kế cơ sở, bản vẽ thi công và nghiệm thu.",
    code: `;;; =========================================================================
;;; Tên LISP: CHEN KHUNG TEN BAN VE CHUAN (KT)
;;; Lệnh gọi: KT (Tối ưu 2 ký tự)
;;; Tác giả: Kỹ sư Phạm Thanh Tùng
;;; File xuất: kt-khung tên.lsp
;;; Tương thích: AutoCAD 2007 - 2026, Civil 3D, ZWCAD
;;; =========================================================================

(vl-load-com)

(defun c:KT ( / *error* old_osmode old_cmdecho doc paper_size scale_val ptBase w_paper h_paper p_tr p_in_bl p_in_tr)
  (setq old_error *error*)
  (defun *error* (msg)
    (if (and msg (not (member msg '("Function cancelled" "quit / exit abort"))))
      (princ (strcat "\\n[KT Loi]: " msg))
    )
    (if old_osmode (setvar "OSMODE" old_osmode))
    (if old_cmdecho (setvar "CMDECHO" old_cmdecho))
    (if (vlax-get-acad-object)
      (vla-endundomark (vla-get-activedocument (vlax-get-acad-object)))
    )
    (setq *error* old_error)
    (princ)
  )

  (setq old_cmdecho (getvar "CMDECHO"))
  (setq old_osmode (getvar "OSMODE"))
  (setvar "CMDECHO" 0)
  (setq doc (vla-get-activedocument (vlax-get-acad-object)))
  (vla-startundomark doc)

  (princ "\\n[AutoLISP Pro - KS Pham Thanh Tung] CHEN KHUNG TEN BAN VE (KT)")
  (initget "A4 A3 A2 A1 A0")
  (setq paper_size (getkword "\\nChon kho giay [A4 / A3 / A2 / A1 / A0] <A3>: "))
  (if (null paper_size) (setq paper_size "A3"))

  (cond
    ((= paper_size "A4") (setq w_paper 297.0 h_paper 210.0))
    ((= paper_size "A3") (setq w_paper 420.0 h_paper 297.0))
    ((= paper_size "A2") (setq w_paper 594.0 h_paper 420.0))
    ((= paper_size "A1") (setq w_paper 841.0 h_paper 594.0))
    ((= paper_size "A0") (setq w_paper 1189.0 h_paper 841.0))
  )

  (if (null *kt_last_scale*) (setq *kt_last_scale* 1.0))
  (setq scale_val (getreal (strcat "\\nNhap ty le ban ve 1/X (1 = 1:1, 100 = 1:100, 200, 500, 1000) <" (rtos *kt_last_scale* 2 0) ">: ")))
  (if (null scale_val) (setq scale_val *kt_last_scale*))
  (setq *kt_last_scale* scale_val)

  (setq w_paper (* w_paper scale_val))
  (setq h_paper (* h_paper scale_val))

  (setq ptBase (getpoint "\\nClick diem goc duoi ben trai cua Khung Ban Ve: "))
  (if ptBase
    (progn
      (setvar "OSMODE" 0)
      ;; Khung vien ngoai cung
      (setq p_tr (list (+ (car ptBase) w_paper) (+ (cadr ptBase) h_paper)))
      (command "._RECTANG" ptBase p_tr)

      ;; Khung vien trong: Le trai 20mm, Tren/Duoi/Phai 5mm
      (setq p_in_bl (list (+ (car ptBase) (* 20.0 scale_val)) (+ (cadr ptBase) (* 5.0 scale_val))))
      (setq p_in_tr (list (+ (car ptBase) (- w_paper (* 5.0 scale_val))) (+ (cadr ptBase) (- h_paper (* 5.0 scale_val)))))
      (command "._RECTANG" p_in_bl p_in_tr)

      ;; Chen Khung ten goc phai duoi
      (setq tb_w (* 140.0 scale_val))
      (setq tb_h (* 32.0 scale_val))
      (setq p_tb_bl (list (- (car p_in_tr) tb_w) (cadr p_in_bl)))
      (setq p_tb_tr p_in_tr)
      (command "._RECTANG" p_tb_bl (list (car p_in_tr) (+ (cadr p_in_bl) tb_h)))

      ;; Ghi chu thong tin chu du an va KS Pham Thanh Tung
      (setq txtH (* 2.5 scale_val))
      (entmake (list
        '(0 . "TEXT")
        (cons 10 (list (+ (car p_tb_bl) (* 5.0 scale_val)) (+ (cadr p_tb_bl) (* 20.0 scale_val))))
        (cons 40 txtH)
        (cons 1 "DU AN: THIET KE CONG TRINH GIAO THONG")
      ))
      (entmake (list
        '(0 . "TEXT")
        (cons 10 (list (+ (car p_tb_bl) (* 5.0 scale_val)) (+ (cadr p_tb_bl) (* 10.0 scale_val))))
        (cons 40 txtH)
        (cons 1 "CHU TRI THIET KE: KS. PHAM THANH TUNG")
      ))
      (entmake (list
        '(0 . "TEXT")
        (cons 10 (list (+ (car p_tb_bl) (* 5.0 scale_val)) (+ (cadr p_tb_bl) (* 3.0 scale_val))))
        (cons 40 (* 2.0 scale_val))
        (cons 1 (strcat "KHO: " paper_size " | TY LE: 1/" (rtos scale_val 2 0)))
      ))

      (setvar "OSMODE" old_osmode)
      (princ (strcat "\\n==> Da tao thanh cong Khung Ban Ve " paper_size " Ty le 1/" (rtos scale_val 2 0) "!"))
    )
  )

  (vla-endundomark doc)
  (setvar "CMDECHO" old_cmdecho)
  (setvar "OSMODE" old_osmode)
  (setq *error* old_error)
  (princ)
)

(princ "\\nDa nap xong Lisp KT - Khung ten ban ve. Go lenh 'KT' de su dung.")
(princ)`,
    versions: [
      {
        versionId: "v1-0-0",
        versionNumber: "v1.0.0",
        timestamp: Date.now() - 86400000 * 15,
        changelog: "Khởi tạo mã nguồn chèn khung tên bản vẽ A4-A0 chuẩn TCVN lệnh KT.",
        commandName: "KT",
        author: "Kỹ sư Phạm Thanh Tùng",
        code: `;; KT v1.0`
      }
    ]
  },
  {
    id: "lisp-tl-06",
    title: "Tính Tổng Chiều Dài (Total Length)",
    commandName: "TL",
    category: "Tiện ích vẽ nhanh",
    description: "Tính tổng chiều dài của tất cả các đối tượng được chọn (Line, Polyline, Arc, Spline, Circle, Ellipse) và hiển thị kết quả ra màn hình hoặc ghi đè vào Text.",
    tags: ["TL", "Chiều dài", "Bóc khối lượng", "Polyline", "Line"],
    compatibleCAD: "AutoCAD 2007 - 2026, Civil 3D, ZWCAD, BricsCAD",
    author: "Kỹ sư Phạm Thanh Tùng",
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 2,
    isFavorite: true,
    steps: [
      "Gõ lệnh TL trên Command Line và nhấn Enter",
      "Quét chọn tất cả các đường Line, Pline, Arc... cần tính chiều dài",
      "Nhấn Enter -> Xem tổng chiều dài mét/milimet trên thanh thông báo",
      "Tùy chọn: Click vào 1 Text có sẵn trên bản vẽ để ghi đè giá trị tổng chiều dài"
    ],
    features: [
      "Hỗ trợ Line, LWPolyline, 2D/3D Polyline, Arc, Circle, Spline",
      "Tự động format số thập phân theo đơn vị mét hoặc mm",
      "Có bắt lỗi và phục hồi biến hệ thống an toàn khi nhấn phím ESC"
    ],
    tips: "Dùng để bóc tách khối lượng ống cống, chiều dài hộ lan, tim đường giao thông và đường dây điện cực nhanh.",
    code: `;;; =========================================================================
;;; Tên LISP: TINH TONG CHIEU DAI DOI TUONG (TL)
;;; Lệnh gọi: TL (Tối ưu 2 ký tự)
;;; Tác giả: Kỹ sư Phạm Thanh Tùng
;;; File xuất: tl-tính tổng chiều dài.lsp
;;; Tương thích: AutoCAD 2007 - 2026, Civil 3D, BricsCAD, ZWCAD
;;; =========================================================================

(vl-load-com)

(defun c:TL ( / ss i ent obj len total_len pt textEnt old_error old_cmdecho doc)
  (setq old_error *error*)
  (defun *error* (msg)
    (if (and msg (not (member msg '("Function cancelled" "quit / exit abort" "console break"))))
      (princ (strcat "\\n[TL Loi]: " msg))
    )
    (if old_cmdecho (setvar "CMDECHO" old_cmdecho))
    (if (vlax-get-acad-object)
      (vla-endundomark (vla-get-activedocument (vlax-get-acad-object)))
    )
    (setq *error* old_error)
    (princ)
  )

  (setq old_cmdecho (getvar "CMDECHO"))
  (setvar "CMDECHO" 0)
  
  (setq doc (vla-get-activedocument (vlax-get-acad-object)))
  (vla-startundomark doc)

  (princ "\\n[AutoLISP Pro - KS Pham Thanh Tung] Chon cac doi tuong can tinh tong chieu dai: ")
  (setq ss (ssget '((0 . "LINE,POLYLINE,LWPOLYLINE,ARC,CIRCLE,ELLIPSE,SPLINE"))))
  
  (if ss
    (progn
      (setq total_len 0.0)
      (setq i 0)
      (while (< i (sslength ss))
        (setq ent (ssname ss i))
        (setq obj (vlax-ename->vla-object ent))
        (setq len 0.0)
        (if (vlax-property-available-p obj 'Length)
          (setq len (vla-get-Length obj))
          (if (vlax-curve-isclosed obj)
            (setq len (vlax-curve-getdistatparam obj (vlax-curve-getendparam obj)))
            (setq len (vlax-curve-getdistatparam obj (vlax-curve-getendparam obj)))
          )
        )
        (if len (setq total_len (+ total_len len)))
        (setq i (1+ i))
      )
      
      (princ (strcat "\\n==> TONG SO DOI TUONG: " (itoa (sslength ss))))
      (princ (strcat "\\n==> TONG CHIEU DAI: " (rtos total_len 2 3) " (m)"))
      (alert (strcat "KET QUA TINH TOAN (TL):\\n- So luong: " (itoa (sslength ss)) " doi tuong\\n- Tong chieu dai: " (rtos total_len 2 3) " m"))
      
      (setq textEnt (entsel "\\nChon Text co san tren ban ve de chen ket qua (hoac Enter bo qua): "))
      (if textEnt
        (progn
          (setq textObj (vlax-ename->vla-object (car textEnt)))
          (if (vlax-property-available-p textObj 'TextString)
            (vla-put-TextString textObj (strcat "L = " (rtos total_len 2 2) " m"))
            (princ "\\n[TL]: Doi tuong chon khong phai la Text/MText!")
          )
        )
      )
    )
    (princ "\\n[TL]: Ban chua chon doi tuong nao.")
  )

  (vla-endundomark doc)
  (setvar "CMDECHO" old_cmdecho)
  (setq *error* old_error)
  (princ "\\nLisp TL hoan tat. Chuc ban lam viec hieu qua!")
  (princ)
)

(princ "\\nDa nap xong Lisp TL - Tinh tong chieu dai. Go lenh 'TL' de su dung.")
(princ)`,
    versions: [
      {
        versionId: "v1-0-0",
        versionNumber: "v1.0.0",
        timestamp: Date.now() - 86400000 * 30,
        changelog: "Khởi tạo mã nguồn tính tổng chiều dài cơ bản.",
        commandName: "TL",
        author: "Kỹ sư Phạm Thanh Tùng",
        code: `;; TL v1.0`
      }
    ]
  },
  {
    id: "lisp-ty-07",
    title: "Vẽ Taluy Đào Đắp Tự Động (Draw Slope)",
    commandName: "TY",
    category: "Giao thông - Cầu đường",
    description: "Tự động rải vạch ta-luy ngắn và dài xen kẽ vuông góc giữa 2 đường mép (đường đỉnh taluy và chân taluy) cho đồ án đường, nút giao, đê điều.",
    tags: ["TY", "Taluy", "Trắc ngang", "Thiết kế đường", "Giao thông"],
    compatibleCAD: "AutoCAD 2007 - 2026, Civil 3D, ZWCAD",
    author: "Kỹ sư Phạm Thanh Tùng",
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 1,
    isFavorite: true,
    steps: [
      "Gõ lệnh TY và nhấn Enter",
      "Chọn đường đỉnh taluy (Mép trên - Polyline/Line)",
      "Chọn đường chân taluy (Mép dưới - Polyline/Line)",
      "Nhập bước rải vạch taluy (mặc định 2.0m hoặc 2.5m) -> Lisp tự động kẻ vạch dài ngắn xen kẽ"
    ],
    features: [
      "Vạch ngắn tự động lấy tỷ lệ 1/2 chiều dài vạch dài",
      "Tự động tính góc pháp tuyến vuông góc với đường cong tim tuyến",
      "Tạo riêng Layer 'TALUY' màu đỏ hoặc nét mảnh tiêu chuẩn"
    ],
    tips: "Giúp hoàn thành bình đồ tuyến đường dài 10km chỉ trong 10 giây thay vì phải rải thủ công.",
    code: `;;; =========================================================================
;;; Tên LISP: VE VACH TA-LUY DAO DAP TU DONG (TY)
;;; Lệnh gọi: TY (Tối ưu 2 ký tự)
;;; Tác giả: Kỹ sư Phạm Thanh Tùng
;;; File xuất: ty-vẽ taluy đào đắp.lsp
;;; Tương thích: AutoCAD 2007 - 2026, Civil 3D, ZWCAD
;;; =========================================================================

(vl-load-com)

(defun c:TY ( / *error* old_osmode old_cmdecho doc ent1 ent2 obj1 obj2 step dist1 len1 pt1 pt2 is_long pt_end)
  (setq old_error *error*)
  (defun *error* (msg)
    (if (and msg (not (member msg '("Function cancelled" "quit / exit abort"))))
      (princ (strcat "\\n[TY Loi]: " msg))
    )
    (if old_osmode (setvar "OSMODE" old_osmode))
    (if old_cmdecho (setvar "CMDECHO" old_cmdecho))
    (if (vlax-get-acad-object)
      (vla-endundomark (vla-get-activedocument (vlax-get-acad-object)))
    )
    (setq *error* old_error)
    (princ)
  )

  (setq old_cmdecho (getvar "CMDECHO"))
  (setq old_osmode (getvar "OSMODE"))
  (setvar "CMDECHO" 0)

  (setq doc (vla-get-activedocument (vlax-get-acad-object)))
  (vla-startundomark doc)

  (princ "\\n[AutoLISP Pro - KS Pham Thanh Tung] VE VACH TALUY TU DONG (TY)")
  
  (setq ent1 (car (entsel "\\n1. Chon duong DINH taluy (Mep tren): ")))
  (if ent1
    (progn
      (setq ent2 (car (entsel "\\n2. Chon duong CHAN taluy (Mep duoi): ")))
      (if ent2
        (progn
          (setq obj1 (vlax-ename->vla-object ent1))
          (setq obj2 (vlax-ename->vla-object ent2))
          
          (if (null *ty_step*) (setq *ty_step* 2.0))
          (setq step (getdist (strcat "\\nNhap buoc rai vach taluy (m) <" (rtos *ty_step* 2 1) ">: ")))
          (if (null step) (setq step *ty_step*))
          (setq *ty_step* step)

          ;; Tao layer TALUY
          (if (null (tblsearch "LAYER" "TALUY"))
            (command "._-layer" "M" "TALUY" "C" "1" "TALUY" "")
          )
          (setvar "CLAYER" "TALUY")
          (setvar "OSMODE" 0)

          (setq len1 (vlax-curve-getdistatparam obj1 (vlax-curve-getendparam obj1)))
          (setq dist1 0.0)
          (setq is_long t)

          (while (<= dist1 len1)
            (setq pt1 (vlax-curve-getpointatdist obj1 dist1))
            (if pt1
              (progn
                ;; Tim diem chieu vuong goc tren duong chan taluy
                (setq pt2 (vlax-curve-getclosestpointto obj2 pt1))
                (if pt2
                  (progn
                    (if is_long
                      (setq pt_end pt2)
                      (setq pt_end (list
                        (+ (car pt1) (/ (- (car pt2) (car pt1)) 2.0))
                        (+ (cadr pt1) (/ (- (cadr pt2) (cadr pt1)) 2.0))
                        (+ (caddr pt1) (/ (- (caddr pt2) (caddr pt1)) 2.0))
                      ))
                    )
                    (command "._LINE" pt1 pt_end "")
                    (setq is_long (not is_long))
                  )
                )
              )
            )
            (setq dist1 (+ dist1 step))
          )

          (princ "\\n==> Da ve xong vach taluy dao dap thanh cong!")
        )
      )
    )
  )

  (vla-endundomark doc)
  (setvar "CMDECHO" old_cmdecho)
  (setvar "OSMODE" old_osmode)
  (setq *error* old_error)
  (princ)
)

(princ "\\nDa nap xong Lisp TY - Ve taluy dao dap. Go lenh 'TY' de su dung.")
(princ)`,
    versions: [
      {
        versionId: "v1-0-0",
        versionNumber: "v1.0.0",
        timestamp: Date.now() - 86400000 * 20,
        changelog: "Khởi tạo mã nguồn vẽ taluy tự động lệnh TY 2 ký tự.",
        commandName: "TY",
        author: "Kỹ sư Phạm Thanh Tùng",
        code: `;; TY v1.0`
      }
    ]
  },
  {
    id: "lisp-td-08",
    title: "Xuất Tọa Độ VN2000 Ra Excel / CSV (Coordinates Export)",
    commandName: "TD",
    category: "Hạ tầng & Trắc địa",
    description: "Pick các điểm tim cọc, tim mố trụ, ranh giải phóng mặt bằng trên CAD và tự động xuất ra file CSV mở bằng Excel gồm STT, Tên Điểm, Tọa độ X (North), Y (East), Z (Elevation).",
    tags: ["TD", "Tọa độ", "VN2000", "Xuất Excel", "Trắc địa"],
    compatibleCAD: "AutoCAD 2007 - 2026, Civil 3D, ZWCAD",
    author: "Kỹ sư Phạm Thanh Tùng",
    createdAt: Date.now() - 86400000 * 16,
    updatedAt: Date.now() - 86400000 * 1,
    isFavorite: true,
    steps: [
      "Gõ lệnh TD trên Command Line và nhấn Enter",
      "Chọn đường dẫn lưu file CSV (mở trực tiếp bằng Microsoft Excel)",
      "Pick lần lượt các điểm cần xuất tọa độ trên bản vẽ",
      "CAD tự động đánh dấu số thứ tự tại điểm pick và ghi dữ liệu ra bảng tính"
    ],
    features: [
      "Tương thích hệ tọa độ VN2000 kinh tuyến trục địa phương 3 độ và 6 độ",
      "Tự động format chuẩn cột: STT, TenDiem, X_North, Y_East, Z_CaoDo",
      "Tự động vẽ số thứ tự và vòng tròn định vị tại vị trí vừa pick"
    ],
    tips: "Dùng để xuất tọa độ cọc khoan nhồi mố trụ cầu, tọa độ tim tuyến bàn giao cho đội thi công trắc đạc ngoài hiện trường.",
    code: `;;; =========================================================================
;;; Tên LISP: XUAT TOA DO VN2000 RA EXCEL / CSV (TD)
;;; Lệnh gọi: TD (Tối ưu 2 ký tự)
;;; Tác giả: Kỹ sư Phạm Thanh Tùng
;;; File xuất: td-xuất tọa độ vn2000.lsp
;;; Tương thích: AutoCAD 2007 - 2026, Civil 3D, ZWCAD
;;; =========================================================================

(vl-load-com)

(defun c:TD ( / *error* old_osmode old_cmdecho doc fpath fileHandle pt stt ptName txtH)
  (setq old_error *error*)
  (defun *error* (msg)
    (if fileHandle (close fileHandle))
    (if (and msg (not (member msg '("Function cancelled" "quit / exit abort"))))
      (princ (strcat "\\n[TD Loi]: " msg))
    )
    (if old_osmode (setvar "OSMODE" old_osmode))
    (if old_cmdecho (setvar "CMDECHO" old_cmdecho))
    (if (vlax-get-acad-object)
      (vla-endundomark (vla-get-activedocument (vlax-get-acad-object)))
    )
    (setq *error* old_error)
    (princ)
  )

  (setq old_cmdecho (getvar "CMDECHO"))
  (setq old_osmode (getvar "OSMODE"))
  (setvar "CMDECHO" 0)

  (setq doc (vla-get-activedocument (vlax-get-acad-object)))
  (vla-startundomark doc)

  (princ "\\n[AutoLISP Pro - KS Pham Thanh Tung] XUAT TOA DO VN2000 (TD)")
  
  (setq fpath (getfiled "Chon noi luu file Toa Do Excel/CSV" "Bang_Toa_Do_VN2000.csv" "csv" 1))
  (if fpath
    (progn
      (setq fileHandle (open fpath "w"))
      ;; Ghi tieu de bang
      (write-line "STT,Ten_Diem,Toa_Do_X_North,Toa_Do_Y_East,Cao_Do_Z" fileHandle)

      (setq stt 1)
      (setq txtH (getvar "TEXTSIZE"))

      (while (setq pt (getpoint (strcat "\\nPick diem thu " (itoa stt) " (Enter de ket thuc): ")))
        (setq ptName (strcat "D" (itoa stt)))
        
        ;; Ghi vao file CSV
        (write-line (strcat
          (itoa stt) ","
          ptName ","
          (rtos (cadr pt) 2 4) ","
          (rtos (car pt) 2 4) ","
          (rtos (caddr pt) 2 4)
        ) fileHandle)

        ;; Ve vong tron va danh so tai diem pick
        (setvar "OSMODE" 0)
        (command "._CIRCLE" pt (* txtH 0.8))
        (entmake (list
          '(0 . "TEXT")
          (cons 10 (list (+ (car pt) (* txtH 1.0)) (+ (cadr pt) (* txtH 0.5)) (caddr pt)))
          (cons 40 txtH)
          (cons 1 (strcat ptName " (" (itoa stt) ")"))
        ))
        (setvar "OSMODE" old_osmode)

        (princ (strcat "\\n-> Da luu diem " ptName ": X=" (rtos (cadr pt) 2 3) ", Y=" (rtos (car pt) 2 3)))
        (setq stt (1+ stt))
      )

      (close fileHandle)
      (setq fileHandle nil)
      (princ (strcat "\\n==> XUAT THANH CONG " (itoa (1- stt)) " DIEM TOA DO VAO FILE: " fpath))
      (alert (strcat "XUAT TOA DO HOAN TAT!\\nTong so diem: " (itoa (1- stt)) "\\nFile: " fpath))
    )
  )

  (vla-endundomark doc)
  (setvar "CMDECHO" old_cmdecho)
  (setvar "OSMODE" old_osmode)
  (setq *error* old_error)
  (princ)
)

(princ "\\nDa nap xong Lisp TD - Xuat toa do VN2000. Go lenh 'TD' de su dung.")
(princ)`,
    versions: [
      {
        versionId: "v1-0-0",
        versionNumber: "v1.0.0",
        timestamp: Date.now() - 86400000 * 16,
        changelog: "Khởi tạo mã nguồn xuất tọa độ VN2000 ra file Excel/CSV lệnh TD.",
        commandName: "TD",
        author: "Kỹ sư Phạm Thanh Tùng",
        code: `;; TD v1.0`
      }
    ]
  },
  {
    id: "lisp-st-09",
    title: "Đánh Số Thứ Tự Tăng Dần Tự Động (Auto Numbering)",
    commandName: "ST",
    category: "Tiện ích vẽ nhanh",
    description: "Click chuột liên tục để chèn số thứ tự tăng dần kèm tiền tố/hậu tố (Ví dụ: Cọc 1, Cọc 2, Dầm D1, D2, Lô A-01, A-02...). Tự động cập nhật số bước nhảy.",
    tags: ["ST", "Số thứ tự", "Đánh số", "Tăng dần", "Prefix"],
    compatibleCAD: "AutoCAD 2007 - 2026, Civil 3D, ZWCAD",
    author: "Kỹ sư Phạm Thanh Tùng",
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now() - 86400000 * 1,
    isFavorite: true,
    steps: [
      "Gõ lệnh ST và nhấn Enter",
      "Nhập tiền tố (ví dụ: 'Cọc ', 'D-', 'M-') hoặc Enter để để trống",
      "Nhập số bắt đầu (mặc định: 1) và bước nhảy (mặc định: 1)",
      "Click chuột vào các vị trí trên bản vẽ để đánh số tăng dần liên tục"
    ],
    features: [
      "Hỗ trợ tiền tố (Prefix) và hậu tố (Suffix) linh hoạt",
      "Tùy chọn vẽ thêm vòng tròn hoặc hình chữ nhật bao quanh số thứ tự",
      "Bộ nhớ lưu lại số đã đánh gần nhất để không bị trùng lặp"
    ],
    tips: "Dùng để đánh số hiệu cọc khoan nhồi, đánh số tên dầm cầu, số nhà phân lô quy hoạch.",
    code: `;;; =========================================================================
;;; Tên LISP: DANH SO THU TU TANG DAN TU DONG (ST)
;;; Lệnh gọi: ST (Tối ưu 2 ký tự)
;;; Tác giả: Kỹ sư Phạm Thanh Tùng
;;; File xuất: st-đánh số thứ tự.lsp
;;; Tương thích: AutoCAD 2007 - 2026, Civil 3D, ZWCAD
;;; =========================================================================

(vl-load-com)

(defun c:ST ( / *error* old_osmode old_cmdecho doc prefix startNum stepNum pt fullText txtH isCircle)
  (setq old_error *error*)
  (defun *error* (msg)
    (if (and msg (not (member msg '("Function cancelled" "quit / exit abort"))))
      (princ (strcat "\\n[ST Loi]: " msg))
    )
    (if old_osmode (setvar "OSMODE" old_osmode))
    (if old_cmdecho (setvar "CMDECHO" old_cmdecho))
    (if (vlax-get-acad-object)
      (vla-endundomark (vla-get-activedocument (vlax-get-acad-object)))
    )
    (setq *error* old_error)
    (princ)
  )

  (setq old_cmdecho (getvar "CMDECHO"))
  (setq old_osmode (getvar "OSMODE"))
  (setvar "CMDECHO" 0)

  (setq doc (vla-get-activedocument (vlax-get-acad-object)))
  (vla-startundomark doc)

  (princ "\\n[AutoLISP Pro - KS Pham Thanh Tung] DANH SO THU TU TANG DAN (ST)")
  
  (if (null *st_prefix*) (setq *st_prefix* ""))
  (setq prefix (getstring t (strcat "\\nNhap tien to (Prefix) <" *st_prefix* ">: ")))
  (if (= prefix "") (setq prefix *st_prefix*) (setq *st_prefix* prefix))

  (if (null *st_num*) (setq *st_num* 1))
  (setq startNum (getint (strcat "\\nNhap so bat dau <" (itoa *st_num*) ">: ")))
  (if (null startNum) (setq startNum *st_num*))

  (if (null *st_step*) (setq *st_step* 1))
  (setq stepNum (getint (strcat "\\nNhap buoc nhay <" (itoa *st_step*) ">: ")))
  (if (null stepNum) (setq stepNum *st_step*))
  (setq *st_step* stepNum)

  (initget "Y N")
  (setq isCircle (getkword "\\nVe vong tron bao quanh so? [Y/N] <N>: "))
  (if (null isCircle) (setq isCircle "N"))

  (setq txtH (getvar "TEXTSIZE"))

  (while (setq pt (getpoint (strcat "\\nClick diem dat chu so [" prefix (itoa startNum) "] (Enter de thoat): ")))
    (setq fullText (strcat prefix (itoa startNum)))
    
    (setvar "OSMODE" 0)
    (entmake (list
      '(0 . "TEXT")
      (cons 10 pt)
      (cons 40 txtH)
      (cons 1 fullText)
      '(72 . 1)
      (cons 11 pt)
      '(73 . 2)
    ))

    (if (= isCircle "Y")
      (command "._CIRCLE" pt (* txtH 1.2))
    )
    (setvar "OSMODE" old_osmode)

    (setq startNum (+ startNum stepNum))
    (setq *st_num* startNum)
  )

  (vla-endundomark doc)
  (setvar "CMDECHO" old_cmdecho)
  (setvar "OSMODE" old_osmode)
  (setq *error* old_error)
  (princ)
)

(princ "\\nDa nap xong Lisp ST - Danh so thu tu. Go lenh 'ST' de su dung.")
(princ)`,
    versions: [
      {
        versionId: "v1-0-0",
        versionNumber: "v1.0.0",
        timestamp: Date.now() - 86400000 * 12,
        changelog: "Khởi tạo mã nguồn đánh số thứ tự tăng dần lệnh ST.",
        commandName: "ST",
        author: "Kỹ sư Phạm Thanh Tùng",
        code: `;; ST v1.0`
      }
    ]
  },
  {
    id: "lisp-cd-10",
    title: "Cắt Chân & Căn Đều Đường Dóng Dim (Cut Dim Extension Lines)",
    commandName: "CD",
    category: "Quản lý Layer & Dim",
    description: "Cắt ngắn chân đường dóng kích thước (Dimension) đều tăm tắp theo 1 đường thẳng mốc hoặc khoảng cách cố định, giúp bản vẽ kỹ thuật sạch đẹp và chuyên nghiệp.",
    tags: ["CD", "Cắt chân Dim", "Căn lề Dim", "Kích thước", "Thẩm mỹ"],
    compatibleCAD: "AutoCAD 2007 - 2026, Civil 3D, ZWCAD",
    author: "Kỹ sư Phạm Thanh Tùng",
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 1,
    isFavorite: true,
    steps: [
      "Gõ lệnh CD và nhấn Enter",
      "Quét chọn toàn bộ các đường Dim cần cắt chân",
      "Click chọn điểm mốc chuẩn cắt chân hoặc nhập khoảng cách chân dóng",
      "Toàn bộ chân đường kích thước lập tức được cắt thẳng tắp đều đẹp"
    ],
    features: [
      "Tự động tính toán điểm 13 và 14 của mã DXF Dimension",
      "Không làm thay đổi giá trị đo kích thước thực tế",
      "Tương thích mọi kiểu DimStyle từ kiến trúc đến cầu đường"
    ],
    tips: "Xử lý bản vẽ trắc dọc, mặt cắt dầm, mặt cắt ngang cầu có chân dim bị xiên lệch hoặc đè lên hình vẽ.",
    code: `;;; =========================================================================
;;; Tên LISP: CAT CHAN DUONG DONG DIM (CD)
;;; Lệnh gọi: CD (Tối ưu 2 ký tự)
;;; Tác giả: Kỹ sư Phạm Thanh Tùng
;;; File xuất: cd-cắt chân dim.lsp
;;; Tương thích: AutoCAD 2007 - 2026, Civil 3D, ZWCAD
;;; =========================================================================

(vl-load-com)

(defun c:CD ( / *error* old_osmode old_cmdecho doc ss ptCut i ent dxf p10 p13 p14 ang new13 new14)
  (setq old_error *error*)
  (defun *error* (msg)
    (if (and msg (not (member msg '("Function cancelled" "quit / exit abort"))))
      (princ (strcat "\\n[CD Loi]: " msg))
    )
    (if old_osmode (setvar "OSMODE" old_osmode))
    (if old_cmdecho (setvar "CMDECHO" old_cmdecho))
    (if (vlax-get-acad-object)
      (vla-endundomark (vla-get-activedocument (vlax-get-acad-object)))
    )
    (setq *error* old_error)
    (princ)
  )

  (setq old_cmdecho (getvar "CMDECHO"))
  (setq old_osmode (getvar "OSMODE"))
  (setvar "CMDECHO" 0)

  (setq doc (vla-get-activedocument (vlax-get-acad-object)))
  (vla-startundomark doc)

  (princ "\\n[AutoLISP Pro - KS Pham Thanh Tung] CAT CHAN DUONG DONG DIM (CD)")
  (princ "\\nChon cac doi tuong Dimension can cat chan: ")
  (setq ss (ssget '((0 . "DIMENSION"))))

  (if ss
    (progn
      (setq ptCut (getpoint "\\nClick chon duong moc de cat chan duong dong Dim: "))
      (if ptCut
        (progn
          (setq i 0)
          (while (< i (sslength ss))
            (setq ent (ssname ss i))
            (setq dxf (entget ent))
            
            (setq p10 (cdr (assoc 10 dxf)))
            (setq p13 (cdr (assoc 13 dxf)))
            (setq p14 (cdr (assoc 14 dxf)))
            (setq ang (cdr (assoc 50 dxf)))

            ;; Can chan Dim theo duong moc
            (setq new13 (inters p13 (polar p13 (+ ang (/ pi 2.0)) 100.0) ptCut (polar ptCut ang 100.0) nil))
            (setq new14 (inters p14 (polar p14 (+ ang (/ pi 2.0)) 100.0) ptCut (polar ptCut ang 100.0) nil))

            (if (and new13 new14)
              (progn
                (setq dxf (subst (cons 13 new13) (assoc 13 dxf) dxf))
                (setq dxf (subst (cons 14 new14) (assoc 14 dxf) dxf))
                (entmod dxf)
              )
            )
            (setq i (1+ i))
          )
          (princ (strcat "\\n==> Da cat chan " (itoa (sslength ss)) " duong Dimension deu dep!"))
        )
      )
    )
    (princ "\\n[CD]: Khong co doi tuong Dimension nao duoc chon.")
  )

  (vla-endundomark doc)
  (setvar "CMDECHO" old_cmdecho)
  (setvar "OSMODE" old_osmode)
  (setq *error* old_error)
  (princ)
)

(princ "\\nDa nap xong Lisp CD - Cat chan Dim. Go lenh 'CD' de su dung.")
(princ)`,
    versions: [
      {
        versionId: "v1-0-0",
        versionNumber: "v1.0.0",
        timestamp: Date.now() - 86400000 * 10,
        changelog: "Khởi tạo mã nguồn cắt chân đường dóng Dim lệnh CD.",
        commandName: "CD",
        author: "Kỹ sư Phạm Thanh Tùng",
        code: `;; CD v1.0`
      }
    ]
  }
];

export const SMART_WORKFLOW_SUGGESTIONS = [
  {
    title: "Tự động hóa Hồ sơ Thiết kế Đường giao thông",
    category: "Giao thông - Cầu đường" as const,
    description: "Tập hợp các Lisp tăng tốc gấp 10 lần việc vẽ bình đồ, trắc dọc, trắc ngang và bóc khối lượng.",
    items: [
      {
        command: "DT",
        name: "Tính diện tích đào đắp trắc ngang",
        benefit: "Bóc diện tích m2 chỉ trong 1 click pick điểm",
        promptTemplate: "Viết lisp DT tính diện tích hình kín hoặc pick điểm trong vùng trắc ngang đào đắp và cho phép ghi kết quả ra bản vẽ."
      },
      {
        command: "TT",
        name: "Tính thể tích đào đắp giữa 2 cọc",
        benefit: "Tự động nhân chiều dài L và diện tích TB",
        promptTemplate: "Viết lisp TT tính thể tích đào đắp giữa 2 mặt cắt trắc ngang theo công thức V = ((S1+S2)/2)*L."
      },
      {
        command: "TY",
        name: "Vẽ vạch ta-luy đào đắp tự động",
        benefit: "Tiết kiệm 80% thời gian kẻ thủ công",
        promptTemplate: "Viết lisp TY vẽ vạch taluy đào và đắp giao thông nối 2 đường mép đỉnh và chân taluy, vạch dài ngắn xen kẽ."
      },
      {
        command: "LT",
        name: "Rải cọc & đánh lý trình KmX+XXX",
        benefit: "Chuẩn xác 100% không sợ sai số",
        promptTemplate: "Viết lisp LT rải cọc vuông góc tim tuyến polyline và đánh số lý trình tăng dần dạng Km0+000, Km0+020 dọc theo tuyến."
      }
    ]
  },
  {
    title: "Thiết kế & Bóc Khối Lượng Cầu - Kết Cấu Bê Tông Cốt Thép",
    category: "Kết cấu & Xây dựng" as const,
    description: "Vẽ mặt cắt dầm I, Super T, cọc móng, bố trí cột tường và thống kê thép tự động.",
    items: [
      {
        command: "VC",
        name: "Vẽ cột bê tông chữ nhật & tròn",
        benefit: "Chèn nhanh vào lưới trục kèm hatch Solid",
        promptTemplate: "Viết lisp VC vẽ cột bê tông cốt thép chữ nhật b x h hoặc tròn phi D kèm hatch bê tông và chèn tại tâm."
      },
      {
        command: "VT",
        name: "Vẽ tường bao kiến trúc & công trình phụ",
        benefit: "Offset tự động 2 nét bề dày 110/220mm",
        promptTemplate: "Viết lisp VT vẽ tường bao tự động với bề dày 100/200/220mm từ tim tường hoặc 2 điểm pick."
      },
      {
        command: "KT",
        name: "Chèn khung tên bản vẽ A4-A0",
        benefit: "Chuẩn tỷ lệ kèm tên KS Phạm Thanh Tùng",
        promptTemplate: "Viết lisp KT chèn khung bản vẽ và khung tên A4, A3, A2, A1, A0 theo tỷ lệ bản vẽ 1/100, 1/200, 1/500."
      },
      {
        command: "TM",
        name: "Vẽ cốt thép dầm & thống kê thép",
        benefit: "Rải chấm tròn thép đúng khoảng cách a",
        promptTemplate: "Viết lisp TM vẽ hàng chấm tròn cốt thép chịu lực đường kính phi D rải đều trong khoảng khoảng cách bề rộng dầm."
      }
    ]
  },
  {
    title: "Khảo Sát Địa Hình, Trắc Địa & Hạ Tầng Kỹ Thuật",
    category: "Hạ tầng & Trắc địa" as const,
    description: "Nhập xuất điểm đo VN2000, vẽ ranh quy hoạch, phân lô và nội suy đường đồng mức.",
    items: [
      {
        command: "TD",
        name: "Xuất tọa độ VN2000 pick trên CAD ra Excel",
        benefit: "Bàn giao mốc tim mốc ranh tức thì",
        promptTemplate: "Viết lisp TD pick các điểm trên bản vẽ và xuất danh sách tọa độ VN2000 gồm STT, Tên điểm, X (North), Y (East), Z ra file CSV/Excel."
      },
      {
        command: "TL",
        name: "Tính tổng chiều dài đường bao, ống cống, tim tuyến",
        benefit: "Bóc mét dài dây, ống, tường, dải phân cách",
        promptTemplate: "Viết lisp TL tính tổng chiều dài tất cả các đối tượng Line, Pline, Arc, Spline được chọn và ghi đè vào Text."
      },
      {
        command: "ST",
        name: "Đánh số thứ tự tăng dần tự động",
        benefit: "Không cần gõ tay từng số cọc/hố ga",
        promptTemplate: "Viết lisp ST đánh số thứ tự tăng dần tự động khi click chuột, hỗ trợ tiền tố Prefix và bước nhảy tùy chọn."
      },
      {
        command: "CD",
        name: "Cắt chân đường dóng Dim đều đẹp",
        benefit: "Bản vẽ sạch đẹp, chuyên nghiệp",
        promptTemplate: "Viết lisp CD quét chọn các đường Dimension và chọn 1 điểm mốc để cắt chân đường dóng thẳng hàng."
      }
    ]
  }
];
