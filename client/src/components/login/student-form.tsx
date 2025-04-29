import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

const formSchema = z.object({
  school: z.string().min(1, "School is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

type FormData = z.infer<typeof formSchema>;

export default function StudentForm() {
  const { login, isLoading } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      school: "",
      username: "",
      password: ""
    }
  });
  
  const { data: users = [], isLoading: isLoadingSchools } = useQuery({
    queryKey: ["/api/users"],
  });
  
  // Get unique schools from users
  const schools = [...new Set(users
    .filter(user => user.school)
    .map(user => ({ id: user.id, name: user.school })))
  ];
  
  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    try {
      await login(data.username, data.password, data.school);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Login failed. Please try again.");
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="school"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">School</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={isLoading || isLoadingSchools}
              >
                <FormControl>
                  <SelectTrigger className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <SelectValue placeholder="Select your school" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Ananda Balika Vidyalaya, Colombo">Ananda Balika Vidyalaya, Colombo</SelectItem>
                  <SelectItem value="Ananda College, Colombo">Ananda College, Colombo</SelectItem>
                  <SelectItem value="Ananda Sastralaya, Kotte">Ananda Sastralaya, Kotte</SelectItem>
                  <SelectItem value="Andiambalama Maha Vidyalaya">Andiambalama Maha Vidyalaya</SelectItem>
                  <SelectItem value="Anula Vidyalaya, Nugegoda">Anula Vidyalaya, Nugegoda</SelectItem>
                  <SelectItem value="Asoka College, Colombo">Asoka College, Colombo</SelectItem>
                  <SelectItem value="Bandaranayaka Vidyalaya, Gampaha">Bandaranayaka Vidyalaya, Gampaha</SelectItem>
                  <SelectItem value="Bandaranayake Central College, Veyangoda">Bandaranayake Central College, Veyangoda</SelectItem>
                  <SelectItem value="Basilica College, Ragama">Basilica College, Ragama</SelectItem>
                  <SelectItem value="Batuwatta Maha Vidyalaya, Ragama">Batuwatta Maha Vidyalaya, Ragama</SelectItem>
                  <SelectItem value="Bishop's College, Colombo">Bishop's College, Colombo</SelectItem>
                  <SelectItem value="Biyagama Madhya Maha Vidyalaya, Biyagama">Biyagama Madhya Maha Vidyalaya, Biyagama</SelectItem>
                  <SelectItem value="Bomiriya Central College, Bomiriya, Kaduwela">Bomiriya Central College, Bomiriya, Kaduwela</SelectItem>
                  <SelectItem value="Boys' Model College, Malabe">Boys' Model College, Malabe</SelectItem>
                  <SelectItem value="British School in Colombo">British School in Colombo</SelectItem>
                  <SelectItem value="Buddhist Ladies' College, Colombo">Buddhist Ladies' College, Colombo</SelectItem>
                  <SelectItem value="Bulathsinhala Central College, Bulathsinhala">Bulathsinhala Central College, Bulathsinhala</SelectItem>
                  <SelectItem value="Burhani Serandib School, Colombo">Burhani Serandib School, Colombo</SelectItem>
                  <SelectItem value="Burullapitiya Maha Vidyalaya, Minuwangoda">Burullapitiya Maha Vidyalaya, Minuwangoda</SelectItem>
                  <SelectItem value="C. W. W. Kannangara Madya Maha Vidyalaya, Mathugama">C. W. W. Kannangara Madya Maha Vidyalaya, Mathugama</SelectItem>
                  <SelectItem value="Carey College, Colombo">Carey College, Colombo</SelectItem>
                  <SelectItem value="Central College Homagama">Central College Homagama</SelectItem>
                  <SelectItem value="Christ King College, Tudella">Christ King College, Tudella</SelectItem>
                  <SelectItem value="Colvin R. De Silva Maha Vidyalaya, Ittapana">Colvin R. De Silva maha Vidyalaya, Ittapana</SelectItem>
                  <SelectItem value="Convent of Our lady of Victories, Moratuwa">Convent of Our lady of Victories, Moratuwa</SelectItem>
                  <SelectItem value="D.S Senanayake Central College, Beruwala">D.S Senanayake Central College, Beruwala</SelectItem>
                  <SelectItem value="D.S. Senanayake College, Colombo">D.S. Senanayake College, Colombo</SelectItem>
                  <SelectItem value="D.S. Senanayake Central College, Mirigama">D.S. Senanayake Central College, Mirigama</SelectItem>
                  <SelectItem value="Daranagama Maha Vidyalaya, Siyambalape">Daranagama Maha Vidyalaya, Siyambalape</SelectItem>
                  <SelectItem value="Davi Samara Maha Vidyalaya, Seeduwa">Davi Samara Maha Vidyalaya, Seeduwa</SelectItem>
                  <SelectItem value="Devi Balika Vidyalaya, Colombo">Devi Balika Vidyalaya, Colombo</SelectItem>
                  <SelectItem value="Dharmapala Vidyalaya, Pannipitiya">Dharmapala Vidyalaya, Pannipitiya</SelectItem>
                  <SelectItem value="Don Pedrick Maha Vidyalaya, Horana">Don Pedrick Maha Vidyalaya, Horana</SelectItem>
                  <SelectItem value="Dutugamunu Maha Vidyalaya, Thimbirigaskotuwa">Dutugamunu Maha Vidyalaya, Thimbirigaskotuwa</SelectItem>
                  <SelectItem value="Elizabeth Moir School, Colombo">Elizabeth Moir School, Colombo</SelectItem>
                  <SelectItem value="Galahitiyawa Central College, Ganemulla">Galahitiyawa Central College, Ganemulla</SelectItem>
                  <SelectItem value="Gamini Madhya Maha Vidyalaya, Ingiriya">Gamini Madhya Maha Vidyalaya, Ingiriya</SelectItem>
                  <SelectItem value="Gnanodaya Maha Vidyalaya, Kalutara South">Gnanodaya Maha Vidyalaya, Kalutara South</SelectItem>
                  <SelectItem value="Good Shepherd Convent, Colombo">Good Shepherd Convent, Colombo</SelectItem>
                  <SelectItem value="Good Sheperd Balika Maha Vidyalaya, Wattala">Good Sheperd Balika Maha Vidyalaya, Wattala</SelectItem>
                  <SelectItem value="Gothami Balika Vidyalaya, Colombo">Gothami Balika Vidyalaya, Colombo</SelectItem>
                  <SelectItem value="Gurukula College, Kelaniya">Gurukula College, Kelaniya</SelectItem>
                  <SelectItem value="Gurulugomi Maha Vidyalaya, Kalutara North">Gurulugomi Maha Vidyalaya, Kalutara North</SelectItem>
                  <SelectItem value="Hameed Al Husseinie College">Hameed Al Husseinie College</SelectItem>
                  <SelectItem value="Hanwella Rajasinghe Central College">Hanwella Rajasinghe Central College</SelectItem>
                  <SelectItem value="Harischandra College">Harischandra College</SelectItem>
                  <SelectItem value="Heenkenda Maha Vidyalaya, Ragama">Heenkenda Maha Vidyalaya, Ragama</SelectItem>
                  <SelectItem value="Henegama Central College - National School, Henegama">Henegama Central College - National School, Henegama</SelectItem>
                  <SelectItem value="Hindu College, Colombo">Hindu College, Colombo</SelectItem>
                  <SelectItem value="Holy Family Convent, Bambalapitiya">Holy Family Convent, Bambalapitiya</SelectItem>
                  <SelectItem value="Holy Family Convent, Dehiwela">Holy Family Convent, Dehiwela</SelectItem>
                  <SelectItem value="Horana Royal College, Horana">Horana Royal College, Horana</SelectItem>
                  <SelectItem value="Isipathana College, Colombo">Isipathana College, Colombo</SelectItem>
                  <SelectItem value="Jinaraja Maha Vidyalaya, Ja Ela">Jinaraja Maha Vidyalaya, Ja Ela</SelectItem>
                  <SelectItem value="Kadawatha Madhya Maha Vidyalaya, Kadawatha">Kadawatha Madhya Maha Vidyalaya, Kadawatha</SelectItem>
                  <SelectItem value="Kalutara Balika Vidyalaya, Kalutara">Kalutara Balika Vidyalaya, Kalutara</SelectItem>
                  <SelectItem value="Kalutara Vidyalaya">Kalutara Vidyalaya</SelectItem>
                  <SelectItem value="Kamburawala Maha Vidyalaya, Baduraliya">Kamburawala Maha Vidyalaya, Baduraliya</SelectItem>
                  <SelectItem value="Kanza College, Colombo">Kanza College, Colombo</SelectItem>
                  <SelectItem value="Katukurunda Dharmapala Maha Vidyalaya, Katukurunda">Katukurunda Dharmapala Maha Vidyalaya, Katukurunda</SelectItem>
                  <SelectItem value="Kebel College, Nugegoda">Kebel College, Nugegoda</SelectItem>
                  <SelectItem value="Kelani Maha Vidyalaya">Kelani Maha Vidyalaya</SelectItem>
                  <SelectItem value="Kirillawala Madhya Maha Vidyalaya, Kadawatha">Kirillawala Madhya Maha Vidyalaya, Kadawatha</SelectItem>
                  <SelectItem value="Kirindiwela Madhya Maha Vidyalaya, Kirindiwela">Kirindiwela Madhya Maha Vidyalaya, Kirindiwela</SelectItem>
                  <SelectItem value="Kochchikade Maha Vidyalaya, Kochchikade">Kochchikade Maha Vidyalaya, Kochchikade</SelectItem>
                  <SelectItem value="Kolonnawa Girl's College">Kolonnawa Girl's College</SelectItem>
                  <SelectItem value="Kotahena Central College">Kotahena Central College</SelectItem>
                  <SelectItem value="Lalith Athulathmudali College, Mount Lavinia">Lalith Athulathmudali College, Mount Lavinia</SelectItem>
                  <SelectItem value="Ladies' College, Colombo">Ladies' College, Colombo</SelectItem>
                  <SelectItem value="Logos College, Colombo">Logos College, Colombo</SelectItem>
                  <SelectItem value="Louvre College, Pannipitiya">Louvre College, Pannipitiya</SelectItem>
                  <SelectItem value="Louvre College, Nugegoda">Louvre College, Nugegoda</SelectItem>
                  <SelectItem value="Lumbini College, Colombo">Lumbini College, Colombo</SelectItem>
                  <SelectItem value="Madduma Bandara Maha Vidyalaya, Weliweriya">Madduma Bandara Maha Vidyalaya, Weliweriya</SelectItem>
                  <SelectItem value="Mahanama College, Colombo">Mahanama College, Colombo</SelectItem>
                  <SelectItem value="Mahamaya Balika Maha Vidyalaya, Kadawatha">Mahamaya Balika Maha Vidyalaya, Kadawatha</SelectItem>
                  <SelectItem value="Mahinda Rajapaksha Vidyalaya, Homagama">Mahinda Rajapaksha Vidyalaya, Homagama</SelectItem>
                  <SelectItem value="Meril Kariyawasam Madhya Maha Vidyalaya, Meegahatenna">Meril Kariyawasam Madhya Maha Vidyalaya, Meegahatenna</SelectItem>
                  <SelectItem value="Methodist College, Colombo">Methodist College, Colombo</SelectItem>
                  <SelectItem value="Mihindu Madhya Maha Vidyalaya, Agalawatta">Mihindu Madhya Maha Vidyalaya, Agalawatta</SelectItem>
                  <SelectItem value="Miriswatta National School, Dodangoda">Miriswatta National School, Dodangoda</SelectItem>
                  <SelectItem value="Muslim Central College, Kalutara South">Muslim Central College, Kalutara South</SelectItem>
                  <SelectItem value="Muslim Ladies College, Colombo">Muslim Ladies College, Colombo</SelectItem>
                  <SelectItem value="Nalanda (Boys') Central College, Minuwangoda">Nalanda (Boys') Central College, Minuwangoda</SelectItem>
                  <SelectItem value="Nalanda (Girls') Central College, Minuwangoda">Nalanda (Girls') Central College, Minuwangoda</SelectItem>
                  <SelectItem value="Nalanda College, Colombo">Nalanda College, Colombo</SelectItem>
                  <SelectItem value="Newstead Girls College, Negombo">Newstead Girls College, Negombo</SelectItem>
                  <SelectItem value="Nirmala Mariya Balika Maha Vidyalaya, Ja Ela">Nirmala Mariya Balika Maha Vidyalaya, Ja Ela</SelectItem>
                  <SelectItem value="Padmawathie Madhya Maha Vidyalaya, Dekatana">Padmawathie Madhya Maha Vidyalaya, Dekatana</SelectItem>
                  <SelectItem value="Palannoruwa Central College, Gonapola Junction">Palannoruwa Central College, Gonapola Junction</SelectItem>
                  <SelectItem value="Pallewela Maha Vidyalaya, Pallewela">Pallewela Maha Vidyalaya, Pallewela</SelectItem>
                  <SelectItem value="Panadura Royal College">Panadura Royal College</SelectItem>
                  <SelectItem value="Pasyala Maha Vidyalya, Pasyala">Pasyala Maha Vidyalya, Pasyala</SelectItem>
                  <SelectItem value="Piliyandala Central College">Piliyandala Central College</SelectItem>
                  <SelectItem value="Prajapathi Balia Maha Vidyalaya, Horana">Prajapathi Balia Maha Vidyalaya, Horana</SelectItem>
                  <SelectItem value="Presbyterian Girls' School Dehiwala">Presbyterian Girls' School Dehiwala</SelectItem>
                  <SelectItem value="President's College">President's College</SelectItem>
                  <SelectItem value="President's College, Minuwangoda">President's College, Minuwangoda</SelectItem>
                  <SelectItem value="President's College, Veyangoda">President's College, Veyangoda</SelectItem>
                  <SelectItem value="Prince of Wales' College, Moratuwa">Prince of Wales' College, Moratuwa</SelectItem>
                  <SelectItem value="Princess of Wales' College">Princess of Wales' College</SelectItem>
                  <SelectItem value="Rajasinghe Maha Vidyala, Imbulgoda">Rajasinghe Maha Vidyala, Imbulgoda</SelectItem>
                  <SelectItem value="Ramanathan Hindu Ladies College, Colombo">Ramanathan Hindu Ladies College, Colombo</SelectItem>
                  <SelectItem value="Rathnavali Balika MV, Gampaha">Rathnavali Balika MV, Gampaha</SelectItem>
                  <SelectItem value="Rathnawali Balika Maha Vidyalaya, Colombo">Rathnawali Balika Maha Vidyalaya, Colombo</SelectItem>
                  <SelectItem value="Royal College, Colombo">Royal College, Colombo</SelectItem>
                  <SelectItem value="S.K.K Sooriyaarachchi Maha Vidyalaya, Kadawatha">S.K.K Sooriyaarachchi Maha Vidyalaya, Kadawatha</SelectItem>
                  <SelectItem value="Saddhathissa College, Bandaragama">Saddhathissa College, Bandaragama</SelectItem>
                  <SelectItem value="Sapugaskanda Maha Vidyalaya, Makola">Sapugaskanda Maha Vidyalaya, Makola</SelectItem>
                  <SelectItem value="Science College, Mount Lavinia">Science College, Mount Lavinia</SelectItem>
                  <SelectItem value="Seethawaka National School">Seethawaka National School</SelectItem>
                  <SelectItem value="Senarath Paranawithana Maha Vidyalaya, Udugampola">Senarath Paranawithana Maha Vidyalaya, Udugampola</SelectItem>
                  <SelectItem value="Sirimavo Bandaranaike Balika Vidyalaya, Colombo">Sirimavo Bandaranaike Balika Vidyalaya, Colombo</SelectItem>
                  <SelectItem value="Siyane National School">Siyane National School</SelectItem>
                  <SelectItem value="Sri Chandrajothi Maha Vidyalaya, Yakkala">Sri Chandrajothi Maha Vidyalaya, Yakkala</SelectItem>
                  <SelectItem value="Sri Dharmaloka College">Sri Dharmaloka College</SelectItem>
                  <SelectItem value="Sri Gnanissara Maha Vidyalaya, Dharga Town">Sri Gnanissara Maha Vidyalaya, Dharga Town</SelectItem>
                  <SelectItem value="Sri Gnanodaya Madhya Maha Vidyalaya, Divulapitiya">Sri Gnanodaya Madhya Maha Vidyalaya, Divulapitiya</SelectItem>
                  <SelectItem value="Sri Palee College, Horana">Sri Palee College, Horana</SelectItem>
                  <SelectItem value="Sri Sangabodhi National College">Sri Sangabodhi National College</SelectItem>
                  <SelectItem value="SRI Subhuthi National school">SRI Subhuthi National school</SelectItem>
                  <SelectItem value="SRI RAJASINGHE CENTRAL, MULLERIYAWA">SRI RAJASINGHE CENTRAL, MULLERIYAWA</SelectItem>
                  <SelectItem value="Sri Saddhatissa Maha Vidyalaya, Bandaragama">Sri Saddhatissa Maha Vidyalaya, Bandaragama</SelectItem>
                  <SelectItem value="Sri Sumangala College, Panadura">Sri Sumangala College, Panadura</SelectItem>
                  <SelectItem value="Sri Sumangala Girls College, Pandura">Sri Sumangala Girls College, Pandura</SelectItem>
                  <SelectItem value="St Anne's Balika Maha Vidyalaya, Wattala">St. Anne's Balika Maha Vidyalaya, Wattala</SelectItem>
                  <SelectItem value="St Anthony's College, Wattala">St Anthony's College, Wattala</SelectItem>
                  <SelectItem value="St Joseph's Boys' College, Nugegoda">St. Joseph's Boys' College, Nugegoda</SelectItem>
                  <SelectItem value="St Mary's College, Negombo">St. Mary’s College, Negombo</SelectItem>
                  <SelectItem value="St. Mary's College, Matugama">St. Mary's College, Matugama</SelectItem>
                  <SelectItem value="St Paul's Girls School, Colombo">St Paul's Girls School, Colombo</SelectItem>
                  <SelectItem value="St. Paul's Balika Maha Vidyalaya, Kelaniya">St. Paul's Balika Maha Vidyalaya, Kelaniya</SelectItem>
                  <SelectItem value="St Peter’s College, Negombo">St Peter’s College, Negombo</SelectItem>
                  <SelectItem value="St. Peter's College, Colombo">St. Peter's College, Colombo</SelectItem>
                  <SelectItem value="St. Sebastian's Balika Maha Vidyalaya, Kandana">St. Sebastian's Balika Maha Vidyalaya, Kandana</SelectItem>
                  <SelectItem value="St. Sebastian’s College, Kandana">St. Sebastian’s College, Kandana</SelectItem>
                  <SelectItem value="St. Sebastian's College, Moratuwa">St. Sebastian's College, Moratuwa</SelectItem>
                  <SelectItem value="St. Thomas' College, Mount Lavinia">St. Thomas' College, Mount Lavinia</SelectItem>
                  <SelectItem value="Sujatha Vidyalaya, Nugegoda">Sujatha Vidyalaya, Nugegoda</SelectItem>
                  <SelectItem value="Sussex College, Nugegoda">Sussex College, Nugegoda</SelectItem>
                  <SelectItem value="Taxila Central College, Horana">Taxila Central College, Horana</SelectItem>
                  <SelectItem value="Thakshila College Gampaha">Thakshila College Gampaha</SelectItem>
                  <SelectItem value="Thurston College, Colombo">Thurston College, Colombo</SelectItem>
                  <SelectItem value="Tissa Central College, Kalutara">Tissa Central College, Kalutara</SelectItem>
                  <SelectItem value="Urapola Madhya Maha Vidyalaya, Urapola">Urapola Madhya Maha Vidyalaya, Urapola</SelectItem>
                  <SelectItem value="Vihara Maha Devi Balika Vidyalaya, Kiribathgoda">Vihara Maha Devi Balika Vidyalaya, Kiribathgoda</SelectItem>
                  <SelectItem value="Visakha Balika Maha Vidyalaya, Makola">Visakha Balika Maha Vidyalaya, Makola</SelectItem>
                  <SelectItem value="Visakha Vidyalaya, Colombo">Visakha Vidyalaya, Colombo</SelectItem>
                  <SelectItem value="Wadduwa Madhya Maha Vidyalaya, Wadduwa">Wadduwa Madhya Maha Vidyalaya, Wadduwa</SelectItem>
                  <SelectItem value="Walagedara Maha Vidyalaya, Walagedara">Walagedara Maha Vidyalaya, Walagedara</SelectItem>
                  <SelectItem value="Warakagoda Maha Vidyalaya, Neboda">Warakagoda Maha Vidyalaya, Neboda</SelectItem>
                  <SelectItem value="Wesley College, Colombo">Wesley College, Colombo</SelectItem>
                  <SelectItem value="Wewita Maithree Maha Vidyalaya, Bandaragama">Wewita Maithree Maha Vidyalaya, Bandaragama</SelectItem>
                  <SelectItem value="Wijayaratnam Hindu Central College, Negombo">Wijayaratnam Hindu Central College, Negombo</SelectItem>
                  <SelectItem value="Yashodara Devi Balika Maha Vidyalaya - Gampaha">Yashodara Devi Balika Maha Vidyalaya - Gampaha</SelectItem>
                  <SelectItem value="Zahira College, Dharga Town">Zahira College, Dharga Town</SelectItem>
                  <SelectItem value="Zahira Muslim Maha Vidyalaya, Dharga Town">Zahira Muslim Maha Vidyalaya, Dharga Town</SelectItem>
                  <SelectItem value="Zam Refai Hajiar Maha Vidyalaya, Beruwala">Zam Refai Hajiar Maha Vidyalaya, Beruwala</SelectItem>
                  <SelectItem value="Al Ashar Muslim Maha Vidyalaya, Thihariya">Al Ashar Muslim Maha Vidyalaya, Thihariya</SelectItem>
                  <SelectItem value="Al Faharia Muslim Central College, Pandura">Al Faharia Muslim Central College, Pandura</SelectItem>
                  <SelectItem value="Al Hilal Muslim Central College, Negombo">Al Hilal Muslim Central College, Negombo</SelectItem>
                  <SelectItem value="Al-Humaisara National School, Beruwala">Al-Humaisara National School, Beruwala</SelectItem>
                  <SelectItem value="Al Manar International School, Colombo">Al Manar International School, Colombo</SelectItem>
                  <SelectItem value="Alexor International School, Colombo">Alexor International School, Colombo</SelectItem>
                  <SelectItem value="Amal International School, Colombo">Amal International School, Colombo</SelectItem>
                  <SelectItem value="Apple International School, Colombo">Apple International School, Colombo</SelectItem>
                  <SelectItem value="Asian International School, Colombo">Asian International School, Colombo</SelectItem>
                  <SelectItem value="ACE Institute International School, Colombo">ACE Institute International School, Colombo</SelectItem>
                  <SelectItem value="Belvoir College International, Colombo">Belvoir College International, Colombo</SelectItem>
                  <SelectItem value="Bond International School, Colombo">Bond International School, Colombo</SelectItem>
                  <SelectItem value="Brightens International School, Colombo">Brightens International School, Colombo</SelectItem>
                  <SelectItem value="Buckingham International School, Colombo">Buckingham International School, Colombo</SelectItem>
                  <SelectItem value="Brisbane International School, Nugegoda">Brisbane International School, Nugegoda</SelectItem>
                  <SelectItem value="British School in Colombo">British School in Colombo</SelectItem>
                  <SelectItem value="Cambridge International School, Colombo">Cambridge International School, Colombo</SelectItem>
                  <SelectItem value="Campbell International School, Colombo">Campbell International School, Colombo</SelectItem>
                    <SelectItem value="Campbell International School, Kotikawatta">Campbell International School, Kotikawatta</SelectItem>
                  <SelectItem value="Colombo International School, Colombo">Colombo International School, Colombo</SelectItem>
                  <SelectItem value="Crescent Schools International, Colombo">Crescent Schools International, Colombo</SelectItem>
                    <SelectItem value="Crescent Schools International, Wellampitiya">Crescent Schools International, Wellampitiya</SelectItem>
                  <SelectItem value="Colombo South International College, Nugegoda">Colombo South International College, Nugegoda</SelectItem>
                  <SelectItem value="Dhilshaath International College, Dematagoda">Dhilshaath International College, Dematagoda</SelectItem>
                  <SelectItem value="East Asian International College, Nugegoda">East Asian International College, Nugegoda</SelectItem>
                  <SelectItem value="Eskola International School, Colombo">Eskola International School, Colombo</SelectItem>
                  <SelectItem value="Global International School, Colombo">Global International School, Colombo</SelectItem>
                  <SelectItem value="Green Bridge International College, Kolonnawa">Green Bridge International College, Kolonnawa</SelectItem>
                  <SelectItem value="Guidance International School, Piliyandala">Guidance International School, Piliyandala</SelectItem>
                  <SelectItem value="Harcourts International School, Dehiwala">Harcourts International School, Dehiwala</SelectItem>
                  <SelectItem value="Hejaaz International School, Mount Lavinia">Hejaaz International School, Mount Lavinia</SelectItem>
                  <SelectItem value="Horizon College International, Malabe">Horizon College International, Malabe</SelectItem>
                    <SelectItem value="Horizon College International, Nugegoda">Horizon College International, Nugegoda</SelectItem>
                  <SelectItem value="Hilburn International School, Avissawella">Hilburn International School, Avissawella</SelectItem>
                  <SelectItem value="Ikra International School, Colombo">Ikra International School, Colombo</SelectItem>
                    <SelectItem value="Ikra International School, Kolonnawa">Ikra International School, Kolonnawa</SelectItem>
                  <SelectItem value="Ilma International Girls' School, Colombo">Ilma International Girls' School, Colombo</SelectItem>
                  <SelectItem value="J.M.C. International School, Colombo">J.M.C. International School, Colombo</SelectItem>
                    <SelectItem value="J.M.C. International School, Kaduwela">J.M.C. International School, Kaduwela</SelectItem>
                    <SelectItem value="J.M.C. International School, Maharagama">J.M.C. International School, Maharagama</SelectItem>
                    <SelectItem value="J.M.C. International School, Mulleriyawa">J.M.C. International School, Mulleriyawa</SelectItem>
                  <SelectItem value="Kingston College International, Wellawatta">Kingston College International, Wellawatta</SelectItem>
                    <SelectItem value="Kingston College International, Colombo">Kingston College International, Colombo</SelectItem>
                    <SelectItem value="Kingston College International, Mount Lavinia">Kingston College International, Mount Lavinia</SelectItem>
                  <SelectItem value="Lakeland International American School, Ratmalana">Lakeland International American School, Ratmalana</SelectItem>
                  <SelectItem value="Lead the Way Girls' International, Dehiwala">Lead the Way Girls' International, Dehiwala</SelectItem>
                  <SelectItem value="Leeds International School, Piliyandala">Leeds International School, Piliyandala</SelectItem>
                  <SelectItem value="Liberty International School, Colombo">Liberty International School, Colombo</SelectItem>
                    <SelectItem value="Liberty International School, Ethul Kotte">Liberty International School, Ethul Kotte</SelectItem>
                  <SelectItem value="Lyceum International School, Nugegoda">Lyceum International School, Nugegoda</SelectItem>
                  <SelectItem value="Linfield International School, Mortuwa">Linfield International School, Mortuwa</SelectItem>
                    <SelectItem value="Linfield International School, Piliyandala">Linfield International School, Piliyandala</SelectItem>
                    <SelectItem value="Linfield International School, Pannipitiya">Linfield International School, Pannipitiya</SelectItem>
                    <SelectItem value="Linfield International School, Godagama">Linfield International School, Godagama</SelectItem>
                  <SelectItem value="M.D Gunasena International School, Colombo">M.D Gunasena International School, Colombo</SelectItem>
                    <SelectItem value="Mahanama College, Pandura">Mahanama College, Pandura</SelectItem>
                  <SelectItem value="Minasro College, Pelawatta, Mathugama">Minasro College, Pelawatta, Mathugama</SelectItem>
                  <SelectItem value="Musaeus College, Colombo">Musaeus College, Colombo</SelectItem>
                  <SelectItem value="Mysticle Rose Institute International School, Ethulotte">Mysticle Rose Institute International School, Ethulotte</SelectItem>
                  <SelectItem value="NCEF Buddhist College, Mulleriyawa">NCEF Buddhist College, Mulleriyawa</SelectItem>
                  <SelectItem value="Naleem Hajiar Muslim Balika Vidyalaya, Beruwala">Naleem Hajiar Muslim Balika Vidyalaya, Beruwala</SelectItem>
                  <SelectItem value="Pandura Balika Maha Vidyalaya, Pandura">Pandura Balika Maha Vidyalaya, Pandura</SelectItem>
                  <SelectItem value="Pothuwila Maha Vidyalaya, Payagala">Pothuwila Maha Vidyalaya, Payagala</SelectItem>
                  <SelectItem value="Readway International College of Education, Dematagoda">Readway International College of Education, Dematagoda</SelectItem>
                  <SelectItem value="Royal Institute International School, Colombo">Royal Institute International School, Colombo</SelectItem>
                    <SelectItem value="Royal Institute International School, Maharagama">Royal Institute International School, Maharagama</SelectItem>
                    <SelectItem value="Royal Institute International School, Nugegoda">Royal Institute International School, Nugegoda</SelectItem>
                  <SelectItem value="School of Arts and Science, Colombo">School of Arts and Science, Colombo</SelectItem>
                  <SelectItem value="Spectrum College, Mount Lavinia">Spectrum College, Mount Lavinia</SelectItem>
                  <SelectItem value="Springfield College, Colombo">Springfield College, Colombo</SelectItem>
                  <SelectItem value="Stafford International School, Colombo">Stafford International School, Colombo</SelectItem>
                  <SelectItem value="St Benedict's College, Colombo">St Benedict's College, Colombo</SelectItem>
                  <SelectItem value="St Bridget's Convent, Colombo">St Bridget's Convent, Colombo</SelectItem>
                  <SelectItem value="St. Joseph's Boys' College, Nugegoda">St. Joseph's Boys' College, Nugegoda</SelectItem>
                  <SelectItem value="St. Lawrence's Convent, Colombo">St. Lawrence's Convent, Colombo</SelectItem>
                  <SelectItem value="St. Mary's College, Matugama">St. Mary's College, Matugama</SelectItem>
                  <SelectItem value="St. Thomas' College, Mount Lavinia">St. Thomas' College, Mount Lavinia</SelectItem>
                  <SelectItem value="Vidura College, Nawala">Vidura College, Nawala</SelectItem>
                  <SelectItem value="Wycherley International School, Colombo">Wycherley International School, Colombo</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Username</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Enter your username" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Password</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="password" 
                  placeholder="Enter your password" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {submitError && (
          <div className="text-red-500 text-sm">{submitError}</div>
        )}
        
        <Button 
          type="submit" 
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </Form>
  );
}
